import {
  AnimationClipCursor,
  AnimationPose,
  clipBindingMask,
  jointMaskUnion,
  normalizedSumBlender,
  poseCopy,
  poseIdentity,
  sampleClip,
  type AnimationClipBinding,
  type AnimationRig,
  type AnimationSource,
  type AnimationTrackClip,
} from '@gglib/model'
import { BlendSpaceScratch, blendSpaceWeights, MOTION_PARAM_COUNT, type PreparedBlendSpace } from './blendSpace'

/**
 * What drives the sources of a character besides time: the desired motion parameters and the root handling
 */
export class CharacterMotion {
  /**
   * The desired motion parameters by {@link MotionParam} id (Cry `SetDesiredMotionParam`), read by blend spaces
   */
  public readonly params = new Float32Array(MOTION_PARAM_COUNT)
  /**
   * Animation driven motion (Cry `AD_MOTION`, set on Mannequin characters): the root joint stays where the clip starts,
   * the travel of the clip is the character's movement. Off, the root travels with the clip.
   */
  public inPlace = true
}

/**
 * How far a clip moves its root, as the blend space step reads it
 */
export interface ClipTravel {
  /**
   * Seconds, at least a frame
   */
  duration: number
  /**
   * Summed distance between consecutive root keys
   */
  distance: number
  /**
   * Mean root speed between the keys, per second
   */
  speed: number
}

/**
 * The most root keys the game reads
 */
const MAX_ROOT_KEYS = 0x3ff

const travels = new WeakMap<AnimationTrackClip, ClipTravel>()

/**
 * The root travel of a clip over its whole range (one segment), like the parameterizer's segment travel
 *
 * @param rootTarget - the controller id of the root joint
 */
export function clipTravel(clip: AnimationTrackClip, rootTarget: number): ClipTravel {
  let result = travels.get(clip)
  if (result) {
    return result
  }
  const rate = clip.rate
  const total = Math.fround(clip.duration)
  const frame = 1 / rate
  result = { duration: total <= frame ? frame : total, distance: 0, speed: 0 }
  travels.set(clip, result)
  const track = clip.tracks.find((it) => it.target === rootTarget && it.channel === 'translation')
  const keyCount = Math.min(MAX_ROOT_KEYS, Math.trunc(Math.fround(Math.fround(rate * total) + 1)))
  if (!track || keyCount <= 1) {
    return result
  }
  const previous = new Float32Array(3)
  const current = new Float32Array(3)
  sampleTranslation(track.times, track.values, clip.start, previous)
  let poses = 0
  for (let key = 1; key < keyCount; key++) {
    sampleTranslation(track.times, track.values, clip.start + key, current)
    const length = Math.hypot(current[0] - previous[0], current[1] - previous[1], current[2] - previous[2])
    poses++
    result.distance += length
    result.speed += rate * length
    previous.set(current)
  }
  result.speed /= poses
  return result
}

/**
 * A translation track at a time: the first key before the first time, the last after the last, lerp between.
 * Allocates nothing.
 */
function sampleTranslation(times: Float32Array, values: Float32Array, time: number, out: Float32Array) {
  const last = times.length - 1
  if (last <= 0 || time <= times[0]) {
    out[0] = values[0]
    out[1] = values[1]
    out[2] = values[2]
    return
  }
  if (time >= times[last]) {
    out[0] = values[last * 3]
    out[1] = values[last * 3 + 1]
    out[2] = values[last * 3 + 2]
    return
  }
  let lo = 0
  let hi = last
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] <= time) {
      lo = mid
    } else {
      hi = mid
    }
  }
  const t = (time - times[lo]) / (times[hi] - times[lo])
  for (let i = 0; i < 3; i++) {
    out[i] = values[lo * 3 + i] + (values[hi * 3 + i] - values[lo * 3 + i]) * t
  }
}

type Track = AnimationTrackClip['tracks'][number]

interface RootTracks {
  translation: Track | null
  rotation: Track | null
  /**
   * The root's turn about up at the clip start
   */
  startYaw: number
}

const rootTracks = new WeakMap<AnimationTrackClip, RootTracks>()
const rootFrom = new Float32Array(3)
const rootTo = new Float32Array(3)

/**
 * Adds the motion of a clip's root joint between two normalized times to `out` (`x, y, z, yaw`): forward, a looping
 * clip wraps over its end. The root motion the game extracts for animation driven motion (`Extract_DeltaMovement`,
 * the clip path): the turn about the model's up axis (z) the root makes, and its travel, each step expressed in the
 * root's frame at the step's start relative to the clip start, so a character that turns with the root moves along
 * the turned direction. Allocates nothing per call.
 *
 * @param rootTarget - the controller id of the root joint
 */
export function addRootMotion(
  clip: AnimationTrackClip,
  rootTarget: number,
  from: number,
  to: number,
  loop: boolean,
  out: Float32Array,
) {
  let tracks = rootTracks.get(clip)
  if (tracks === undefined) {
    const rotation = clip.tracks.find((it) => it.target === rootTarget && it.channel === 'rotation') ?? null
    tracks = {
      translation: clip.tracks.find((it) => it.target === rootTarget && it.channel === 'translation') ?? null,
      rotation,
      startYaw: rotation ? sampleYaw(rotation, clip.start) : 0,
    }
    rootTracks.set(clip, tracks)
  }
  if (!tracks.translation && !tracks.rotation) {
    return
  }
  if (to >= from) {
    addStep(tracks, clip.timeAt(from), clip.timeAt(to), out)
  } else if (loop) {
    addStep(tracks, clip.timeAt(from), clip.end, out)
    addStep(tracks, clip.start, clip.timeAt(to), out)
  }
}

const blendStep = new Float32Array(4)

/**
 * {@link addRootMotion} of a blend space: the root motion of its clips over the shared normalized time, weighted by
 * the clip weights of its state (negative weights included, as the pose blends them). Allocates nothing per call.
 */
export function addBlendSpaceRootMotion(
  source: BlendSpaceSource,
  state: BlendSpaceState,
  rootTarget: number,
  from: number,
  to: number,
  loop: boolean,
  out: Float32Array,
) {
  let x = 0
  let y = 0
  let z = 0
  let turn = 0
  const bindings = source.bindings
  for (let i = 0; i < bindings.length; i++) {
    const weight = state.clipWeights[i]
    if (!weight) {
      continue
    }
    blendStep.fill(0)
    addRootMotion(bindings[i].clip, rootTarget, from, to, loop, blendStep)
    x += weight * blendStep[0]
    y += weight * blendStep[1]
    z += weight * blendStep[2]
    turn += weight * blendStep[3]
  }
  // in the frame this window already turned to
  const c = Math.cos(out[3])
  const s = Math.sin(out[3])
  out[0] += c * x - s * y
  out[1] += s * x + c * y
  out[2] += z
  out[3] += turn
}

function addStep(tracks: RootTracks, from: number, to: number, out: Float32Array) {
  let turnFrom = 0
  let turn = 0
  if (tracks.rotation) {
    turnFrom = wrapAngle(sampleYaw(tracks.rotation, from) - tracks.startYaw)
    turn = wrapAngle(sampleYaw(tracks.rotation, to) - tracks.startYaw - turnFrom)
  }
  if (tracks.translation) {
    const { times, values } = tracks.translation
    sampleTranslation(times, values, from, rootFrom)
    sampleTranslation(times, values, to, rootTo)
    // the step in the frame the character faces: the root's turn so far less what this window already turned
    const angle = -turnFrom + out[3]
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const dx = rootTo[0] - rootFrom[0]
    const dy = rootTo[1] - rootFrom[1]
    out[0] += c * dx - s * dy
    out[1] += s * dx + c * dy
    out[2] += rootTo[2] - rootFrom[2]
  }
  out[3] += turn
}

/**
 * The twist about z of the rotation track at a time (keys interpolated by normalized lerp)
 */
function sampleYaw(track: Track, time: number): number {
  const times = track.times
  const v = track.values
  const last = times.length - 1
  let k = 0
  let t = 0
  if (last > 0 && time > times[0]) {
    if (time >= times[last]) {
      k = last
    } else {
      let lo = 0
      let hi = last
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (times[mid] <= time) {
          lo = mid
        } else {
          hi = mid
        }
      }
      k = lo
      t = (time - times[lo]) / (times[hi] - times[lo])
    }
  }
  let z = v[k * 4 + 2]
  let w = v[k * 4 + 3]
  if (t > 0) {
    const n = (k + 1) * 4
    const dot = v[k * 4] * v[n] + v[k * 4 + 1] * v[n + 1] + z * v[n + 2] + w * v[n + 3]
    const b = dot < 0 ? -t : t
    z = z * (1 - t) + v[n + 2] * b
    w = w * (1 - t) + v[n + 3] * b
  }
  return 2 * Math.atan2(z, w)
}

function wrapAngle(angle: number): number {
  return angle - Math.round(angle / (2 * Math.PI)) * 2 * Math.PI
}

const rootBindings = new WeakMap<AnimationClipBinding, AnimationClipBinding>()

/**
 * The binding of a clip reduced to the tracks of the root joint (joint 0)
 */
function rootBinding(binding: AnimationClipBinding): AnimationClipBinding {
  let result = rootBindings.get(binding)
  if (!result) {
    result = { clip: binding.clip, joints: binding.joints.map((it) => (it === 0 ? 0 : -1)) }
    rootBindings.set(binding, result)
  }
  return result
}

/**
 * Samples a clip at a normalized time. In place (Cry `AD_MOTION`), the root takes its controller at the clip start,
 * an additive clip keeps its root delta.
 */
function sampleCharacterClip(
  binding: AnimationClipBinding,
  cursor: AnimationClipCursor,
  rootCursor: AnimationClipCursor,
  time: number,
  out: AnimationPose,
  delta: boolean,
  inPlace: boolean,
) {
  const clip = binding.clip
  sampleClip(binding, cursor, clip.timeAt(time), out, delta)
  if (inPlace && !clip.additive) {
    sampleClip(rootBinding(binding), rootCursor, clip.start, out, delta)
  }
}

interface ClipState {
  cursor: AnimationClipCursor
  root: AnimationClipCursor
}

/**
 * A clip playing on a mixer entry of a character
 */
export interface CharacterClipSource extends AnimationSource<ClipState> {
  readonly binding: AnimationClipBinding
}

export function isClipSource(source: AnimationSource | null): source is CharacterClipSource {
  return !!source && 'binding' in source
}

/**
 * A clip as a source of a character, see {@link CharacterMotion.inPlace}
 */
export function characterClipSource(binding: AnimationClipBinding, motion: CharacterMotion): CharacterClipSource {
  const clip = binding.clip
  return {
    binding,
    duration: clip.duration,
    additive: clip.additive,
    // on upper layers only the joints the clip animates (an upper body overlay leaves the legs below)
    mask: clipBindingMask(binding),
    createState: () => {
      return {
        cursor: new AnimationClipCursor(clip),
        root: new AnimationClipCursor(clip),
      }
    },
    sample: (time, out, state, delta) => {
      return sampleCharacterClip(binding, state.cursor, state.root, time, out, delta, motion.inPlace)
    },
  }
}

/**
 * The playback state of a blend space entry
 */
export class BlendSpaceState {
  /**
   * The parameter per dimension
   */
  public readonly params: Float32Array
  /**
   * The weight per slot, normalized
   */
  public readonly weights: Float32Array
  /**
   * The weight per slot summed onto the first slot that plays the same clip
   */
  public readonly clipWeights: Float32Array
  public readonly cursors: AnimationClipCursor[]
  public readonly rootCursors: AnimationClipCursor[]
  public readonly scratch: BlendSpaceScratch
  /**
   * Normalized time per second at speed 1, from the last weights
   */
  public rate = 0
  public initialized = false

  public constructor(space: PreparedBlendSpace, bindings: AnimationClipBinding[]) {
    this.params = new Float32Array(space.dimensions.length)
    this.weights = new Float32Array(space.slots.length)
    this.clipWeights = new Float32Array(space.slots.length)
    this.cursors = bindings.map((it) => new AnimationClipCursor(it.clip))
    this.rootCursors = bindings.map((it) => new AnimationClipCursor(it.clip))
    this.scratch = new BlendSpaceScratch(space)
  }
}

/**
 * A blend space playing on a mixer entry
 */
export interface BlendSpaceSource extends AnimationSource<BlendSpaceState> {
  readonly space: PreparedBlendSpace
  readonly bindings: ReadonlyArray<AnimationClipBinding>
}

export function isBlendSpaceSource(source: AnimationSource | null): source is BlendSpaceSource {
  return !!source && 'space' in source
}

/**
 * A blend space as a source of a character (the game's parametric sampler on a queue entry)
 *
 * @remarks
 * Each step reads the character's motion parameters (a `locked` dimension keeps the value of the entry start),
 * weighs the slots and moves the normalized time: by the weighted root speed over the weighted root distance when the
 * blend travels, else by the weighted duration, times the weighted playback scale. The pose sums the weighted clips,
 * one sample per clip, all at the entry's normalized time.
 *
 * @param bindings - the clip of each slot of the blend space, bound to the rig
 */
export function blendSpaceSource(
  space: PreparedBlendSpace,
  bindings: AnimationClipBinding[],
  rig: AnimationRig,
  motion: CharacterMotion,
): BlendSpaceSource {
  const count = space.slots.length
  const rootTarget = rig.targets[0]
  const travel = bindings.map((it) => clipTravel(it.clip, rootTarget))
  // the first slot that plays the same clip samples it for all of them
  const first = Int16Array.from(bindings, (it) => bindings.findIndex((other) => other.clip === it.clip))
  const additive = bindings.some((it) => it.clip.additive)
  const scale = !!rig.defaultPose.scales
  const sample = new AnimationPose(rig.count, { scale })
  const accumulation = new AnimationPose(rig.count, { scale })
  const blender = normalizedSumBlender
  let lastRate = 0

  const update = (state: BlendSpaceState) => {
    const dims = space.dimensions
    for (let d = 0; d < dims.length; d++) {
      if (!state.initialized || !dims[d].locked) {
        state.params[d] = motion.params[dims[d].param]
      }
    }
    state.initialized = true
    blendSpaceWeights(space, state.params, state.weights, state.scratch)
    let duration = 0
    let distance = 0
    let speed = 0
    let playback = 0
    state.clipWeights.fill(0)
    for (let i = 0; i < count; i++) {
      const weight = state.weights[i]
      if (weight === 0) {
        continue
      }
      speed += weight * travel[i].speed
      distance += weight * travel[i].distance
      duration += weight * travel[i].duration
      playback += weight * space.slots[i].playbackScale
      state.clipWeights[first[i]] += weight
    }
    let rate = 0
    if (0.001 <= distance) {
      rate = speed / distance
    } else if (duration > 0) {
      rate = 1 / duration
    }
    state.rate = rate * playback
    lastRate = state.rate
  }

  return {
    space,
    bindings,
    additive,
    // the joints any of its clips animates
    mask: jointMaskUnion(bindings.map(clipBindingMask)),
    get duration() {
      return lastRate > 0 ? 1 / lastRate : 0
    },
    createState: () => {
      const state = new BlendSpaceState(space, bindings)
      update(state)
      return state
    },
    step: (_time, seconds, state) => {
      update(state)
      return state.rate * seconds
    },
    sample: (time, out, state, delta) => {
      blender.begin(accumulation)
      for (let i = 0; i < count; i++) {
        const weight = state.clipWeights[i]
        // negative weights extrapolate (authored grids hold them), only no weight adds nothing
        if (weight === 0) {
          continue
        }
        if (delta) {
          poseIdentity(sample)
        } else {
          poseCopy(rig.defaultPose, sample)
        }
        sampleCharacterClip(bindings[i], state.cursors[i], state.rootCursors[i], time, sample, delta, motion.inPlace)
        blender.add(sample, weight, accumulation, null)
      }
      blender.end(accumulation)
      poseCopy(accumulation, out)
    },
  }
}
