import type {
  MusicSegmentSpec,
  MusicVoice,
  PcmData,
  SoundVoice,
  Vec3Like,
  VoiceSpatial,
  VoiceSpec,
} from './engine/protocol'

/**
 * distance of quad sources around the listener
 */
const QUAD_DISTANCE = 4
/**
 * schedule music segment instances this far ahead
 */
const MUSIC_LOOKAHEAD = 1.5

interface ClipNodes {
  source: AudioBufferSourceNode
  panner: PannerNode | null
  spatial: VoiceSpatial
  ended: boolean
  mediaId: number
}

interface VoiceState {
  id: number
  spec: VoiceSpec
  gain: GainNode
  clips: ClipNodes[]
  /**
   * music: start time of the next segment instance and its index
   */
  nextTime: number
  nextSegment: number
  done: boolean
}

export interface AudioOutputStats {
  state: AudioContextState | 'none'
  voices: number
  sources: number
  buffers: number
  bufferBytes: number
  peak: number
  rms: number
}

/**
 * Main thread WebAudio renderer of the audio worker. Holds decoded buffers and plays voices as commanded,
 * all decisions (what plays, when it stops) are made in the worker.
 */
export class AudioOutput {
  public context: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private analyserData: Float32Array<ArrayBuffer> | null = null
  private buffers = new Map<number, { buffer: AudioBuffer; bytes: number; used: number }>()
  private bufferBytes = 0
  private voices = new Map<number, VoiceState>()
  private pendingStarts: Array<{ id: number; voice: VoiceSpec; fadeIn: number }> = []
  private listener: Vec3Like = { x: 0, y: 0, z: 0 }
  private masterDb = 0
  private budgetBytes: number

  /**
   * called with media ids evicted from the buffer cache
   */
  public onEvicted: (mediaIds: number[]) => void = () => {}

  public constructor(budgetMB: number) {
    this.budgetBytes = budgetMB * 1024 * 1024
  }

  /**
   * Creates and resumes the context. Must run in a user gesture (click, key) to pass the autoplay policy.
   */
  public unlock() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'playback' })
      this.master = this.context.createGain()
      this.master.gain.value = dbToGain(this.masterDb)
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyserData = new Float32Array(this.analyser.fftSize)
      this.master.connect(this.analyser)
      this.analyser.connect(this.context.destination)
    }
    if (this.context.state !== 'running') {
      this.context.resume()
    }
    const pending = this.pendingStarts
    this.pendingStarts = []
    for (const it of pending) {
      this.start(it.id, it.voice, it.fadeIn)
    }
  }

  public get isRunning() {
    return this.context?.state === 'running'
  }

  /**
   * Pauses all sound, e.g. while the viewer is not shown. {@link AudioOutput.resume} continues.
   */
  public suspend() {
    if (this.context?.state === 'running') {
      this.context.suspend()
    }
  }

  /**
   * Continues the sound after {@link AudioOutput.suspend}. A context that was never unlocked stays locked.
   */
  public resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume()
    }
  }

  public setMasterDb(db: number) {
    this.masterDb = db
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(dbToGain(db), this.context.currentTime, 0.05)
    }
  }

  public setBudget(budgetMB: number) {
    this.budgetBytes = budgetMB * 1024 * 1024
  }

  public addPcm(pcm: PcmData) {
    const frames = pcm.channels[0]?.length ?? 0
    if (!frames) {
      return
    }
    const buffer = new AudioBuffer({
      length: frames,
      numberOfChannels: pcm.channels.length,
      sampleRate: pcm.sampleRate,
    })
    pcm.channels.forEach((data, i) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, i))
    const bytes = frames * pcm.channels.length * 4
    this.buffers.set(pcm.mediaId, { buffer, bytes, used: performance.now() })
    this.bufferBytes += bytes
    this.evict()
  }

  public start(id: number, voice: VoiceSpec, fadeIn: number) {
    const ctx = this.context
    if (!ctx || ctx.state !== 'running') {
      this.pendingStarts.push({ id, voice, fadeIn })
      return
    }
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.setTargetAtTime(dbToGain(voice.gainDb), ctx.currentTime, Math.max(0.01, fadeIn / 3))
    gain.connect(this.master)
    const state: VoiceState = {
      id,
      spec: voice,
      gain,
      clips: [],
      nextTime: ctx.currentTime,
      nextSegment: 0,
      done: false,
    }
    this.voices.set(id, state)
    if (voice.kind === 'sound') {
      this.startSound(state, voice)
    } else {
      if (voice.randomStart) {
        state.nextTime = ctx.currentTime - Math.random() * voice.segments[0].duration
      }
      this.scheduleMusic(state, voice)
    }
  }

  public update(id: number, gainDb?: number, spatial?: VoiceSpatial) {
    const state = this.voices.get(id)
    if (!state || !this.context) {
      return
    }
    if (gainDb !== undefined) {
      state.gain.gain.setTargetAtTime(dbToGain(gainDb), this.context.currentTime, 0.1)
    }
    if (spatial?.kind === 'point') {
      for (const clip of state.clips) {
        clip.spatial = spatial
        if (clip.panner) {
          setPannerPosition(clip.panner, spatial.position, this.context)
        }
      }
    }
  }

  /**
   * Appends segments to a streamed music voice
   */
  public append(id: number, segments: MusicSegmentSpec[]) {
    const pending = this.pendingStarts.find((p) => p.id === id)
    const spec = pending?.voice ?? this.voices.get(id)?.spec
    if (spec?.kind === 'music') {
      spec.segments.push(...segments)
    }
  }

  public stop(id: number, fadeOut: number) {
    const pending = this.pendingStarts.findIndex((p) => p.id === id)
    if (pending >= 0) {
      this.pendingStarts.splice(pending, 1)
      return
    }
    const state = this.voices.get(id)
    if (!state || !this.context) {
      return
    }
    this.voices.delete(id)
    state.done = true
    const end = this.context.currentTime + Math.max(0.02, fadeOut)
    state.gain.gain.cancelScheduledValues(this.context.currentTime)
    state.gain.gain.setValueAtTime(state.gain.gain.value, this.context.currentTime)
    state.gain.gain.linearRampToValueAtTime(0, end)
    for (const clip of state.clips) {
      try {
        clip.source.stop(end + 0.05)
      } catch {}
    }
    setTimeout(() => state.gain.disconnect(), (fadeOut + 0.2) * 1000)
  }

  /**
   * Per frame: listener pose, quad source positions, music scheduling
   */
  public tick(position: Vec3Like, forward: Vec3Like, up: Vec3Like) {
    const ctx = this.context
    if (!ctx || ctx.state !== 'running') {
      return
    }
    this.listener = position
    const l = ctx.listener
    const t = ctx.currentTime
    if (l.positionX) {
      l.positionX.setValueAtTime(position.x, t)
      l.positionY.setValueAtTime(position.y, t)
      l.positionZ.setValueAtTime(position.z, t)
      l.forwardX.setValueAtTime(forward.x, t)
      l.forwardY.setValueAtTime(forward.y, t)
      l.forwardZ.setValueAtTime(forward.z, t)
      l.upX.setValueAtTime(up.x, t)
      l.upY.setValueAtTime(up.y, t)
      l.upZ.setValueAtTime(up.z, t)
    } else {
      l.setPosition(position.x, position.y, position.z)
      l.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
    }
    for (const state of this.voices.values()) {
      for (const clip of state.clips) {
        if (clip.panner && clip.spatial.kind === 'quad') {
          setPannerPosition(clip.panner, quadPosition(position, clip.spatial.dir), ctx)
        }
      }
      if (state.spec.kind === 'music') {
        this.scheduleMusic(state, state.spec)
      }
    }
  }

  public stats(out?: AudioOutputStats): AudioOutputStats {
    out ||= { state: 'none', voices: 0, sources: 0, buffers: 0, bufferBytes: 0, peak: 0, rms: 0 }
    out.state = this.context?.state ?? 'none'
    out.voices = this.voices.size
    out.sources = 0
    for (const v of this.voices.values()) {
      out.sources += v.clips.length
    }
    out.buffers = this.buffers.size
    out.bufferBytes = this.bufferBytes
    out.peak = 0
    out.rms = 0
    if (this.analyser && this.analyserData) {
      this.analyser.getFloatTimeDomainData(this.analyserData)
      let sum = 0
      for (const v of this.analyserData) {
        out.peak = Math.max(out.peak, Math.abs(v))
        sum += v * v
      }
      out.rms = Math.sqrt(sum / this.analyserData.length)
    }
    return out
  }

  /**
   * Stops every voice and drops the decoded buffers, e.g. when the worker is replaced for another level: a new
   * worker knows nothing of what the previous one played or sent
   */
  public reset(fadeOut: number) {
    this.pendingStarts.length = 0
    for (const id of [...this.voices.keys()]) {
      this.stop(id, fadeOut)
    }
    this.buffers.clear()
    this.bufferBytes = 0
  }

  public dispose() {
    this.reset(0)
    this.context?.close()
    this.context = null
  }

  private startSound(state: VoiceState, voice: SoundVoice) {
    const ctx = this.context
    const entry = this.useBuffer(voice.mediaId)
    if (!entry) {
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = entry
    source.playbackRate.value = Math.pow(2, voice.pitchCents / 1200)
    const duration = entry.duration
    let offset = voice.startOffset ?? 0
    if (offset < 0) {
      offset = Math.random() * duration
    }
    if (voice.loopCount !== 1) {
      source.loop = true
    }
    this.connectClip(state, source, voice.spatial, voice.mediaId)
    source.start(ctx.currentTime, offset % duration)
    if (voice.loopCount > 1) {
      source.stop(ctx.currentTime + duration * voice.loopCount - offset)
    }
  }

  private scheduleMusic(state: VoiceState, voice: MusicVoice) {
    const ctx = this.context
    if (state.done || !ctx) {
      return
    }
    // drop finished clips
    state.clips = state.clips.filter((c) => !c.ended)
    while (state.nextTime < ctx.currentTime + MUSIC_LOOKAHEAD) {
      if (state.nextSegment >= voice.segments.length) {
        if (!voice.loop) {
          return
        }
        state.nextSegment = 0
      }
      const segment = voice.segments[state.nextSegment++]
      this.scheduleSegment(state, segment, state.nextTime)
      state.nextTime += segment.duration
    }
  }

  private scheduleSegment(state: VoiceState, segment: MusicSegmentSpec, start: number) {
    const ctx = this.context
    const now = ctx.currentTime
    for (const clip of segment.clips) {
      const buffer = this.useBuffer(clip.mediaId)
      if (!buffer) {
        continue
      }
      let when = start + clip.playAt + clip.beginTrim
      let offset = clip.beginTrim
      let duration = clip.srcDuration - clip.beginTrim + clip.endTrim
      if (when < now) {
        const late = now - when
        when = now
        offset += late
        duration -= late
      }
      if (duration <= 0.01) {
        continue
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const clipGain = ctx.createGain()
      clipGain.gain.value = dbToGain(clip.gainDb)
      source.connect(clipGain)
      const nodes = this.connectClip(state, clipGain, clip.spatial, clip.mediaId, source)
      source.onended = () => {
        nodes.ended = true
        clipGain.disconnect()
        nodes.panner?.disconnect()
      }
      source.start(when, Math.max(0, offset) % buffer.duration, duration)
    }
  }

  /**
   * Connects a node into the voice gain, through a panner for spatial voices
   */
  private connectClip(
    state: VoiceState,
    node: AudioNode,
    spatial: VoiceSpatial,
    mediaId: number,
    source?: AudioBufferSourceNode,
  ): ClipNodes {
    const ctx = this.context
    let panner: PannerNode | null = null
    if (spatial.kind === 'quad') {
      panner = new PannerNode(ctx, {
        panningModel: 'equalpower',
        distanceModel: 'linear',
        refDistance: 1000,
        maxDistance: 10000,
        rolloffFactor: 0,
      })
      setPannerPosition(panner, quadPosition(this.listener, spatial.dir), ctx)
    } else if (spatial.kind === 'point') {
      panner = new PannerNode(ctx, {
        panningModel: 'HRTF',
        distanceModel: 'linear',
        refDistance: Math.min(3, spatial.maxDistance * 0.1),
        maxDistance: spatial.maxDistance,
        rolloffFactor: 1,
      })
      setPannerPosition(panner, spatial.position, ctx)
    }
    if (panner) {
      node.connect(panner)
      panner.connect(state.gain)
    } else {
      node.connect(state.gain)
    }
    const clip: ClipNodes = {
      source: source ?? (node as AudioBufferSourceNode),
      panner,
      spatial,
      ended: false,
      mediaId,
    }
    state.clips.push(clip)
    return clip
  }

  private useBuffer(mediaId: number): AudioBuffer | null {
    const entry = this.buffers.get(mediaId)
    if (!entry) {
      return null
    }
    entry.used = performance.now()
    return entry.buffer
  }

  private evict() {
    if (this.bufferBytes <= this.budgetBytes) {
      return
    }
    // media of clips still playing and of segments still queued, played music segments can go
    const inUse = new Set<number>()
    for (const v of this.voices.values()) {
      for (const clip of v.clips) {
        if (!clip.ended) {
          inUse.add(clip.mediaId)
        }
      }
      if (v.spec.kind === 'sound') {
        inUse.add(v.spec.mediaId)
      }
      if (v.spec.kind === 'music') {
        for (const segment of v.spec.segments.slice(v.nextSegment)) {
          segment.clips.forEach((c) => inUse.add(c.mediaId))
        }
        if (v.spec.loop) {
          collectMedia(v.spec).forEach((id) => inUse.add(id))
        }
      }
    }
    for (const p of this.pendingStarts) {
      collectMedia(p.voice).forEach((id) => inUse.add(id))
    }
    const candidates = [...this.buffers.entries()]
      .filter(([id]) => !inUse.has(id))
      .sort((a, b) => a[1].used - b[1].used)
    const evicted: number[] = []
    for (const [id, entry] of candidates) {
      if (this.bufferBytes <= this.budgetBytes * 0.9) {
        break
      }
      this.buffers.delete(id)
      this.bufferBytes -= entry.bytes
      evicted.push(id)
    }
    if (evicted.length) {
      this.onEvicted(evicted)
    }
  }
}

function collectMedia(voice: VoiceSpec): number[] {
  return voice.kind === 'sound' ? [voice.mediaId] : voice.segments.flatMap((s) => s.clips.map((c) => c.mediaId))
}

function quadPosition(listener: Vec3Like, dir: [number, number]): Vec3Like {
  return { x: listener.x + dir[0] * QUAD_DISTANCE, y: listener.y + dir[1] * QUAD_DISTANCE, z: listener.z }
}

function setPannerPosition(panner: PannerNode, p: Vec3Like, ctx: BaseAudioContext) {
  const t = ctx.currentTime
  panner.positionX.setValueAtTime(p.x, t)
  panner.positionY.setValueAtTime(p.y, t)
  panner.positionZ.setValueAtTime(p.z, t)
}

export function dbToGain(db: number) {
  return Math.pow(10, db / 20)
}
