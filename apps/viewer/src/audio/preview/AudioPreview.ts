import type { PreviewRequest, PreviewResponse } from './protocol'

/**
 * Decoded clips kept for replay, in MB of float samples. The least recently played ones go first.
 */
const CLIP_BUDGET_MB = 256

/**
 * Loads the bytes of a media file (`.wem`), called once per decode
 */
export type MediaLoader = (signal?: AbortSignal) => Promise<Uint8Array>

/**
 * What plays: the clip key, its duration and where it started on the audio clock
 */
export interface PreviewPlayback {
  key: string
  duration: number
  channels: number
  sampleRate: number
  startTime: number
}

/**
 * The audio preview of the browser: decodes Wwise media in a worker (vgmstream), plays one clip at a time, keeps
 * decoded clips under a budget. Used without the engine, so it is a module singleton like `ExportConfig`.
 *
 * @remarks
 * The level audio of the engine does not play while the browser is shown (the engine is suspended, a preview unloads
 * the level), so the two never play together.
 */
export class AudioPreview {
  private worker: Worker | null = null
  private nextId = 0
  private requests = new Map<number, { resolve: (it: PreviewResponse) => void; reject: (err: Error) => void }>()
  private clips = new Map<string, AudioBuffer>()
  private clipBytes = 0
  private pending = new Map<string, Promise<AudioBuffer>>()
  private context: AudioContext | null = null
  private source: AudioBufferSourceNode | null = null
  private listeners = new Set<() => void>()
  /**
   * Changes with every play and stop, a play whose decode finishes after it is dropped
   */
  private playToken = 0

  /**
   * What plays, null when nothing plays
   */
  public playback: PreviewPlayback | null = null
  /**
   * The last decode error by clip key, cleared by a successful decode
   */
  public readonly errors = new Map<string, string>()

  /**
   * Calls the listener when playback or an error changes, returns the unsubscribe function
   */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Seconds played of the current clip, 0 when nothing plays
   */
  public position(): number {
    if (!this.playback || !this.context) {
      return 0
    }
    return Math.min(this.playback.duration, this.context.currentTime - this.playback.startTime)
  }

  /**
   * A decoded clip, from the cache or decoded now
   */
  public clip(key: string, load: MediaLoader): Promise<AudioBuffer> {
    const cached = this.clips.get(key)
    if (cached) {
      // most recently used last
      this.clips.delete(key)
      this.clips.set(key, cached)
      return Promise.resolve(cached)
    }
    let task = this.pending.get(key)
    if (!task) {
      task = this.decodeClip(key, load).finally(() => this.pending.delete(key))
      this.pending.set(key, task)
    }
    return task
  }

  /**
   * Plays a clip, stopping the one that plays. Call it from a user gesture (click): the audio context is created or
   * resumed before the decode.
   */
  public async play(key: string, load: MediaLoader): Promise<void> {
    const context = this.ensureContext()
    this.stop()
    const token = this.playToken
    let buffer: AudioBuffer
    try {
      buffer = await this.clip(key, load)
    } catch {
      return
    }
    // stopped, or another clip was started while this one decoded: the last request wins
    if (token !== this.playToken) {
      return
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.onended = () => {
      if (this.source === source) {
        this.source = null
        this.playback = null
        this.emit()
      }
    }
    source.start()
    this.source = source
    this.playback = {
      key,
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
      sampleRate: buffer.sampleRate,
      startTime: context.currentTime,
    }
    this.emit()
  }

  /**
   * Stops the clip that plays
   */
  public stop() {
    this.playToken++
    const source = this.source
    this.source = null
    if (source) {
      source.onended = null
      try {
        source.stop()
      } catch {}
      source.disconnect()
    }
    if (this.playback) {
      this.playback = null
      this.emit()
    }
  }

  /**
   * The media as a RIFF WAVE file (16 bit PCM, as vgmstream writes it), not cached
   */
  public async wav(load: MediaLoader, signal?: AbortSignal): Promise<Uint8Array> {
    const response = await this.request('wav', await load(signal))
    if (response.kind !== 'wav') {
      throw new Error('unexpected response')
    }
    return response.wav
  }

  private async decodeClip(key: string, load: MediaLoader): Promise<AudioBuffer> {
    try {
      const response = await this.request('pcm', await load())
      if (response.kind !== 'pcm') {
        throw new Error('unexpected response')
      }
      const length = response.channels[0]?.length ?? 0
      if (!length) {
        throw new Error('no samples')
      }
      const buffer = new AudioBuffer({
        length,
        numberOfChannels: response.channels.length,
        sampleRate: response.sampleRate,
      })
      response.channels.forEach((data, i) => buffer.copyToChannel(data as Float32Array<ArrayBuffer>, i))
      this.keep(key, buffer)
      if (this.errors.delete(key)) {
        this.emit()
      }
      return buffer
    } catch (err) {
      this.errors.set(key, String(err instanceof Error ? err.message : err))
      this.emit()
      throw err
    }
  }

  private keep(key: string, buffer: AudioBuffer) {
    const bytes = buffer.length * buffer.numberOfChannels * 4
    this.clips.set(key, buffer)
    this.clipBytes += bytes
    const budget = CLIP_BUDGET_MB * 1024 * 1024
    for (const [oldKey, old] of this.clips) {
      if (this.clipBytes <= budget || oldKey === key) {
        break
      }
      this.clips.delete(oldKey)
      this.clipBytes -= old.length * old.numberOfChannels * 4
    }
  }

  private request(kind: PreviewRequest['kind'], bytes: Uint8Array): Promise<PreviewResponse> {
    this.worker ??= this.createWorker()
    const id = ++this.nextId
    return new Promise<PreviewResponse>((resolve, reject) => {
      this.requests.set(id, { resolve, reject })
      // a copy: the caller may keep its bytes (e.g. the bank of a tab)
      const copy = bytes.slice()
      this.worker!.postMessage({ id, kind, bytes: copy } satisfies PreviewRequest, [copy.buffer])
    })
  }

  private createWorker() {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'audio-preview' })
    worker.addEventListener('message', (event: MessageEvent<PreviewResponse>) => {
      const request = this.requests.get(event.data.id)
      if (!request) {
        return
      }
      this.requests.delete(event.data.id)
      if (event.data.kind === 'error') {
        request.reject(new Error(event.data.message))
      } else {
        request.resolve(event.data)
      }
    })
    worker.addEventListener('error', () => {
      for (const request of this.requests.values()) {
        request.reject(new Error('audio preview worker failed'))
      }
      this.requests.clear()
      worker.terminate()
      this.worker = null
    })
    return worker
  }

  private ensureContext(): AudioContext {
    this.context ??= new AudioContext({ latencyHint: 'playback' })
    if (this.context.state !== 'running') {
      this.context.resume()
    }
    return this.context
  }

  private emit() {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

/**
 * The one audio preview of the app
 */
export const audioPreview = new AudioPreview()
