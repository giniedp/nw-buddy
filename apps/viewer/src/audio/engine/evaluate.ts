import {
  wwiseShortId,
  WwiseHircType,
  WwisePropId,
  type WwiseDecisionNode,
  type WwiseGraphPoint,
  type WwiseHircObject,
  type WwiseLibrary,
  type WwiseMusicPlaylistItem,
  type WwiseNodeBase,
} from '../wwise'
import type { MusicClip, MusicSegmentSpec, MusicVoice, VoiceSpatial, VoiceSpec } from './protocol'

/**
 * Current switch, state and game parameter values, keyed by Wwise short ids
 */
export interface WwiseValues {
  /**
   * global states: group id → state id
   */
  states: Map<number, number>
  /**
   * switches of the playing game object: group id → switch id
   */
  switches: Map<number, number>
}

export interface MediaNeed {
  mediaId: number
  streamed: boolean
}

export interface EvaluateContext {
  library: WwiseLibrary
  values: WwiseValues
  /**
   * listener anchored ambience (QuadAmb) or an emitter with a position
   */
  target: { kind: 'listener' } | { kind: 'emitter'; position: { x: number; y: number; z: number }; maxDistance: number }
  random: () => number
}

export interface EvaluateResult {
  voices: VoiceSpec[]
  media: MediaNeed[]
  /**
   * an object of the tree is not loaded (missing bank)
   */
  missing: number[]
  /**
   * the event had a seek action (start at a random position)
   */
  seek: boolean
  /**
   * id of the node selected by switches, used to detect when re-evaluation changes the output
   */
  signature: string
  /**
   * music playlists, segments are pulled lazily (playlists may loop forever)
   */
  streams: MusicStream[]
}

/**
 * Lazy segment source of a music voice. Each call yields the next segment of the playlist, null at the end.
 * Media of the segment is appended to `media`.
 */
export interface MusicStream {
  voice: MusicVoice
  next: (media: MediaNeed[]) => MusicSegmentSpec | null
}

const SPEAKER_X = wwiseShortId('SpeakerX_FL')
const SPEAKER_Y = wwiseShortId('SpeakerY_FL')
const PARAM_PAN_X = 35
const PARAM_PAN_Y = 36
const PROP_VOLUME = WwisePropId.Volume
const PROP_PITCH = WwisePropId.Pitch
const PROP_BUS_VOLUME = WwisePropId.BusVolume
const PROP_MAKEUP = WwisePropId.MakeUpGain
const PROP_LOOP = WwisePropId.Loop
const CURVE_SCALING_DB = 2

/**
 * Evaluates the play actions of an event into voice specs, following switches, states and containers with
 * the given values. Unloaded objects are reported in `missing`, media that must be decoded in `media`.
 */
export function evaluateEvent(eventName: string, ctx: EvaluateContext): EvaluateResult {
  const result: EvaluateResult = { voices: [], media: [], missing: [], seek: false, signature: '', streams: [] }
  const event = ctx.library.getObject(wwiseShortId(eventName))
  if (!event || event.type !== WwiseHircType.Event) {
    result.missing.push(wwiseShortId(eventName))
    return result
  }
  const signature: number[] = []
  for (const actionId of event.actions) {
    const action = ctx.library.getObject(actionId)
    if (!action || action.type !== WwiseHircType.Action) {
      result.missing.push(actionId)
      continue
    }
    const kind = action.actionType >> 8
    if (kind === 0x1e) {
      result.seek = true
    }
    if (kind !== 0x04 && kind !== 0x05) {
      continue
    }
    evalNode(
      action.targetId,
      { gainDb: outputGainDb(action.targetId, ctx), pitch: 0 },
      ctx,
      result,
      signature,
      new Set(),
    )
  }
  result.signature = signature.join(',')
  if (result.seek) {
    for (const voice of result.voices) {
      if (voice.kind === 'music') {
        voice.randomStart = true
      }
    }
  }
  return result
}

interface Accum {
  gainDb: number
  pitch: number
}

function evalNode(
  id: number,
  parent: Accum,
  ctx: EvaluateContext,
  out: EvaluateResult,
  signature: number[],
  visiting: Set<number>,
) {
  const object = ctx.library.getObject(id)
  if (!object) {
    out.missing.push(id)
    return
  }
  if (visiting.has(id)) {
    return
  }
  visiting.add(id)
  try {
    evalObject(object, parent, ctx, out, signature, visiting)
  } finally {
    visiting.delete(id)
  }
}

function evalObject(
  object: WwiseHircObject,
  parent: Accum,
  ctx: EvaluateContext,
  out: EvaluateResult,
  signature: number[],
  visiting: Set<number>,
) {
  const child = (id: number, acc: Accum) => evalNode(id, acc, ctx, out, signature, visiting)
  switch (object.type) {
    case WwiseHircType.Sound: {
      const acc = accumulate(parent, object.node)
      const loop = object.node.propsRaw.get(PROP_LOOP)
      out.media.push({ mediaId: object.source.mediaId, streamed: object.source.streamType !== 0 })
      out.voices.push({
        kind: 'sound',
        mediaId: object.source.mediaId,
        loopCount: loop === undefined ? 1 : loop,
        gainDb: acc.gainDb,
        pitchCents: acc.pitch,
        spatial: spatialOf(object.node, ctx),
      })
      return
    }
    case WwiseHircType.RanSeqCntr: {
      const acc = accumulate(parent, object.node)
      const items = object.playlist.length ? object.playlist : object.children.map((id) => ({ id, weight: 1 }))
      if (!items.length) {
        return
      }
      // sequence and random step containers play one item per play, continuous containers are approximated
      // by the first pick (looping ambiences loop their item)
      const pick = object.mode === 1 ? items[0] : weightedPick(items, (object.flags & 1) !== 0, ctx.random)
      signature.push(object.id)
      child(pick.id, acc)
      return
    }
    case WwiseHircType.SwitchCntr: {
      const acc = accumulate(parent, object.node)
      const values = object.groupType === 1 ? ctx.values.states : ctx.values.switches
      const value = values.get(object.groupId) ?? object.defaultSwitch
      const pkg =
        object.packages.find((p) => p.switchId === value) ??
        object.packages.find((p) => p.switchId === object.defaultSwitch)
      signature.push(object.id, value)
      for (const node of pkg?.nodes ?? []) {
        child(node, acc)
      }
      return
    }
    case WwiseHircType.LayerCntr:
    case WwiseHircType.ActorMixer: {
      const acc = accumulate(parent, object.node)
      for (const id of object.children) {
        child(id, acc)
      }
      return
    }
    case WwiseHircType.MusicSwitch: {
      const acc = accumulate(parent, object.music.node)
      const values = object.arguments.map(
        (a) => (a.groupType === 1 ? ctx.values.states : ctx.values.switches).get(a.groupId) ?? 0,
      )
      const leaf = resolveDecision(object.tree, values, 0)
      signature.push(object.id, leaf ?? 0)
      if (leaf) {
        child(leaf, acc)
      }
      return
    }
    case WwiseHircType.MusicRanSeq: {
      const acc = accumulate(parent, object.music.node)
      signature.push(object.id)
      const voice: MusicVoice = { kind: 'music', segments: [], loop: false, gainDb: 0, randomStart: false }
      const ids = expandPlaylist(object.playlist, ctx.random)
      const library = ctx.library
      out.voices.push(voice)
      out.streams.push({
        voice,
        next: (media) => {
          // skip segments that are not loaded, a bounded number of times to never spin on a broken playlist
          for (let attempt = 0; attempt < 16; attempt++) {
            const step = ids.next()
            if (step.done) {
              return null
            }
            const segment = library.getObject(step.value)
            if (!segment || segment.type !== WwiseHircType.MusicSegment) {
              continue
            }
            const sink: EvaluateResult = { voices: [], media, missing: [], seek: false, signature: '', streams: [] }
            return segmentSpec(segment, acc, ctx, sink)
          }
          return null
        },
      })
      return
    }
    case WwiseHircType.MusicSegment: {
      const acc = accumulate(parent, object.music.node)
      signature.push(object.id)
      out.voices.push({
        kind: 'music',
        segments: [segmentSpec(object, acc, ctx, out)],
        loop: false,
        gainDb: 0,
        randomStart: false,
      })
      return
    }
  }
}

function segmentSpec(
  segment: Extract<WwiseHircObject, { type: typeof WwiseHircType.MusicSegment }>,
  parent: Accum,
  ctx: EvaluateContext,
  out: EvaluateResult,
): MusicSegmentSpec {
  const acc = accumulate(parent, segment.music.node)
  // markers: entry cue first, exit cue last
  const markers = [...segment.markers].sort((a, b) => a.position - b.position)
  const entry = markers.length >= 2 ? markers[0].position : 0
  const exit = markers.length >= 2 ? markers[markers.length - 1].position : segment.duration
  const clips: MusicClip[] = []
  for (const trackId of segment.music.children) {
    const track = ctx.library.getObject(trackId)
    if (!track || track.type !== WwiseHircType.MusicTrack) {
      out.missing.push(trackId)
      continue
    }
    const trackAcc = accumulate(acc, track.node)
    // random (1) and sequence (2) tracks play one sub track per segment instance
    let subTrack = -1
    if ((track.trackType === 1 || track.trackType === 2) && track.subTracks > 0) {
      subTrack = track.trackType === 1 ? Math.floor(ctx.random() * track.subTracks) : 0
    }
    const spatial = spatialOf(track.node, ctx)
    for (const clip of track.playlist) {
      if (subTrack >= 0 && clip.trackId !== subTrack) {
        continue
      }
      const source = track.sources.find((s) => s.mediaId === clip.sourceId)
      out.media.push({ mediaId: clip.sourceId, streamed: (source?.streamType ?? 0) !== 0 })
      clips.push({
        mediaId: clip.sourceId,
        playAt: (clip.playAt - entry) / 1000,
        beginTrim: clip.beginTrimOffset / 1000,
        endTrim: clip.endTrimOffset / 1000,
        srcDuration: clip.srcDuration / 1000,
        gainDb: trackAcc.gainDb,
        spatial,
      })
    }
  }
  return { duration: Math.max(0.05, (exit - entry) / 1000), clips }
}

function resolveDecision(node: WwiseDecisionNode, values: number[], depth: number): number | null {
  if (node.audioNodeId !== undefined) {
    return node.audioNodeId || null
  }
  const children = node.children ?? []
  const value = values[depth]
  const match = children.find((c) => c.key === value) ?? children.find((c) => c.key === 0)
  return match ? resolveDecision(match, values, depth + 1) : null
}

/**
 * Expands a music playlist into segment ids following the Wwise rules. Infinite for playlists that loop forever.
 *
 * - loop: number of passes, 0 is infinite
 * - rsType 0 sequence continuous: every pass plays all children in order
 * - rsType 1 sequence step: every pass plays the next child
 * - rsType 2 random continuous: every pass plays all children in random order (shuffled)
 * - rsType 3 random step: every pass plays one random child, avoiding the last `avoidRepeatCount`
 */
export function* expandPlaylist(item: WwiseMusicPlaylistItem, random: () => number): Generator<number> {
  const infinite = item.loop === 0
  if (item.segmentId) {
    for (let pass = 0; infinite || pass < Math.max(1, item.loop); pass++) {
      yield item.segmentId
    }
    return
  }
  const children = item.children
  if (!children.length) {
    return
  }
  let sequence = 0
  const recent: number[] = []
  const avoid = Math.min(item.avoidRepeatCount, children.length - 1)
  const pickIndex = () => {
    const candidates = children
      .map((child, index) => ({ index, weight: child.weight }))
      .filter((c) => !recent.includes(c.index))
    const pick = weightedPick(
      candidates.length ? candidates : children.map((c, index) => ({ index, weight: c.weight })),
      item.isUsingWeight,
      random,
    ).index
    recent.push(pick)
    while (recent.length > avoid) {
      recent.shift()
    }
    return pick
  }
  for (let pass = 0; infinite || pass < Math.max(1, item.loop); pass++) {
    let yielded = false
    let order: number[]
    switch (item.rsType) {
      case 1:
        order = [sequence++ % children.length]
        break
      case 2:
        order = shuffle(
          children.map((_, i) => i),
          random,
        )
        break
      case 3:
        order = [pickIndex()]
        break
      default:
        order = children.map((_, i) => i)
    }
    for (const index of order) {
      for (const id of expandPlaylist(children[index], random)) {
        yielded = true
        yield id
      }
    }
    if (!yielded) {
      return
    }
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function weightedPick<T extends { weight: number }>(items: T[], useWeight: boolean, random: () => number): T {
  if (!useWeight) {
    return items[Math.floor(random() * items.length)]
  }
  const total = items.reduce((sum, it) => sum + Math.max(0, it.weight), 0)
  if (total <= 0) {
    return items[Math.floor(random() * items.length)]
  }
  let ticket = random() * total
  for (const it of items) {
    ticket -= Math.max(0, it.weight)
    if (ticket < 0) {
      return it
    }
  }
  return items[items.length - 1]
}

function accumulate(parent: Accum, node: WwiseNodeBase): Accum {
  return {
    gainDb: parent.gainDb + nodeGainDb(node),
    pitch: parent.pitch + (node.props.get(PROP_PITCH) ?? 0),
  }
}

function nodeGainDb(node: WwiseNodeBase) {
  return (
    (node.props.get(PROP_VOLUME) ?? 0) + (node.props.get(PROP_BUS_VOLUME) ?? 0) + (node.props.get(PROP_MAKEUP) ?? 0)
  )
}

function nodeOf(object: WwiseHircObject | null): WwiseNodeBase | null {
  if (!object) {
    return null
  }
  if ('node' in object) {
    return object.node
  }
  if ('music' in object) {
    return object.music.node
  }
  return null
}

/**
 * Gain the play target inherits: the volumes of its parent containers (actor-mixers, music switches, ...) and of the
 * output bus chain. The target's own volume and those below it are added while evaluating the tree.
 * The output bus is the bus of the nearest node that overrides it, starting at the target.
 */
function outputGainDb(targetId: number, ctx: EvaluateContext): number {
  let gainDb = 0
  let busId = 0
  const visited = new Set<number>()
  let id = targetId
  while (id && !visited.has(id)) {
    visited.add(id)
    const node = nodeOf(ctx.library.getObject(id))
    if (!node) {
      break
    }
    if (id !== targetId) {
      gainDb += nodeGainDb(node)
    }
    if (!busId && node.overrideBusId) {
      busId = node.overrideBusId
    }
    id = node.parentId
  }
  visited.clear()
  while (busId && !visited.has(busId)) {
    visited.add(busId)
    const bus = ctx.library.getObject(busId)
    if (!bus || bus.type !== WwiseHircType.Bus) {
      break
    }
    gainDb += (bus.props.get(PROP_VOLUME) ?? 0) + (bus.props.get(PROP_BUS_VOLUME) ?? 0)
    busId = bus.parentBusId
  }
  return gainDb
}

/**
 * Volume over distance of the attenuation that applies to a node: the `AttenuationID` of the nearest node up the
 * hierarchy, decoded to `[distance, linear gain, ...]` pairs. Undefined without an attenuation or when it is not loaded.
 */
function attenuationOf(node: WwiseNodeBase, ctx: EvaluateContext): number[] | undefined {
  const visited = new Set<number>()
  let current: WwiseNodeBase | null = node
  while (current) {
    const id = current.propsRaw.get(WwisePropId.AttenuationID)
    if (id) {
      const object = ctx.library.getObject(id)
      if (object?.type !== WwiseHircType.Attenuation || !object.volume?.points.length) {
        return undefined
      }
      const { scaling, points } = object.volume
      return points.flatMap((it) => [it.from, curveGain(scaling, it.to)])
    }
    if (!current.parentId || visited.has(current.parentId)) {
      return undefined
    }
    visited.add(current.parentId)
    current = nodeOf(ctx.library.getObject(current.parentId))
  }
  return undefined
}

/**
 * Linear gain of a volume curve value. Curves with dB scaling store the linear gain minus 1 (0 = full, -1 = silent),
 * unscaled curves store dB.
 */
function curveGain(scaling: number, value: number) {
  if (scaling === CURVE_SCALING_DB) {
    return Math.min(Math.max(value + 1, 0), 1)
  }
  return Math.pow(10, value / 20)
}

/**
 * Listener ambiences with the speaker RTPCs become quad sources, emitters become point sources.
 * The quad direction is the 2D pan (params 35/36) of the node with the front left speaker input (-1, 1).
 */
function spatialOf(node: WwiseNodeBase, ctx: EvaluateContext): VoiceSpatial {
  if (ctx.target.kind === 'emitter') {
    const attenuation = attenuationOf(node, ctx)
    return { kind: 'point', position: ctx.target.position, maxDistance: ctx.target.maxDistance, attenuation }
  }
  let panX: number | null = null
  let panY: number | null = null
  for (const curve of node.rtpcs) {
    const input = curve.rtpcId === SPEAKER_X ? -1 : curve.rtpcId === SPEAKER_Y ? 1 : null
    if (input === null) {
      continue
    }
    const value = evalCurve(curve.points, input)
    if (curve.paramId === PARAM_PAN_X) {
      panX = value
    }
    if (curve.paramId === PARAM_PAN_Y) {
      panY = value
    }
  }
  if (panX === null || panY === null) {
    return { kind: 'none' }
  }
  const length = Math.hypot(panX, panY) || 1
  return { kind: 'quad', dir: [panX / length, panY / length] }
}

export function evalCurve(points: WwiseGraphPoint[], x: number) {
  if (!points.length) {
    return 0
  }
  if (x <= points[0].from) {
    return points[0].to
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (x <= b.from) {
      const t = (x - a.from) / (b.from - a.from || 1)
      return a.to + (b.to - a.to) * t
    }
  }
  return points[points.length - 1].to
}
