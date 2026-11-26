import type { AdbAnimation, AdbAnimLayer, AdbBlend, AdbFragmentBlend, AdbFragment } from '../../../formats/mannequin'
import { MANNEQUIN_BLEND_DURATION } from '../../../formats/mannequin'
import { sameName } from '../sameName'

/**
 * A transition picked for a fragment change (Cry `SBlendQueryResult`)
 */
export interface TransitionChoice {
  /**
   * The fragment names of the pair, empty for any
   */
  from: string
  to: string
  fragment: AdbFragment
  selectTime: number
  enterTime: number
}

/**
 * What {@link findTransitions} compares
 */
export interface TransitionQuery {
  /**
   * The fragment playing on the scope, empty when none
   */
  from: string
  to: string
  /**
   * The tags the playing fragment installed with, and the tags of the new one (both with the scope's tags)
   */
  tagsFrom: string[]
  tagsTo: string[]
  /**
   * The scope's tags, the variants must have them on both sides
   */
  required: string[]
  /**
   * Seconds the playing fragment has played, compared with `selectTime`
   */
  fragmentTime: number
}

/**
 * The transitions of a fragment change (Cry `CAnimationDatabase::FindBestBlends`): the first pair with a matching
 * variant of exact (`from` → `to`), exit (`from` → any), entry (any → `to`) and any → any. An exit transition is
 * followed by an entry transition when one exists.
 *
 * @remarks
 * - variants: their `from` tags set before, their `to` tags set now, both holding the scope's tags; the more specific
 *   (more tags) first, document order among equals (approximates the sort by tag priority)
 * - within a variant the blend whose `selectTime` the fragment time reached last, the first by default
 * - no frag tags (no game ADB has `fromFrag`/`toFrag` on transitions); `Cyclic`/`CycleLocked`/`Outro` flags are not
 *   read (no game ADB sets them)
 *
 * @param blends - the `FragmentBlendList` entries of the database and its sub databases
 */
export function findTransitions(blends: AdbFragmentBlend[], query: TransitionQuery): TransitionChoice[] {
  const from = query.from.toLowerCase()
  const to = query.to.toLowerCase()
  const pairs: Array<[string, string, boolean]> = [
    [from, to, !!from && !!to],
    [from, '', !!from],
    ['', to, !!to],
    ['', '', true],
  ]
  for (let i = 0; i < pairs.length; i++) {
    const [pairFrom, pairTo, viable] = pairs[i]
    if (!viable) {
      continue
    }
    const first = pickTransition(blends, pairFrom, pairTo, query)
    if (!first) {
      continue
    }
    if (i === 1) {
      // an exit from the old fragment can be followed by an entry into the new one
      const entry = pickTransition(blends, '', to, query)
      return entry && to ? [first, entry] : [first]
    }
    return [first]
  }
  return []
}

function pickTransition(
  blends: AdbFragmentBlend[],
  from: string,
  to: string,
  query: TransitionQuery,
): TransitionChoice | null {
  const variants = blends
    .filter((it) => it.from.toLowerCase() === from && it.to.toLowerCase() === to)
    .flatMap((it) => it.variants)
  // the more specific variants first (Array.sort is stable: document order among equals)
  const sorted = [...variants].sort((a, b) => tagCount(b) - tagCount(a))
  for (const variant of sorted) {
    const valid =
      hasAll(query.tagsFrom, variant.fromTags) &&
      hasAll(query.tagsTo, variant.toTags) &&
      hasAll(variant.fromTags, query.required) &&
      hasAll(variant.toTags, query.required)
    if (!valid || !variant.fragments.length) {
      continue
    }
    const options = [...variant.fragments].sort((a, b) => a.selectTime - b.selectTime)
    let chosen = options[0]
    for (const option of options) {
      if (query.fragmentTime >= option.selectTime) {
        chosen = option
      }
    }
    return { from, to, fragment: chosen.fragment, selectTime: chosen.selectTime, enterTime: chosen.enterTime }
  }
  return null
}

function tagCount(variant: AdbFragmentBlend['variants'][number]): number {
  return variant.fromTags.length + variant.toTags.length
}

function hasAll(set: string[], tags: string[]) {
  return tags.every((tag) => set.some((it) => sameName(it, tag)))
}

/**
 * A clip of an assembled layer: its blend with the exit time resolved (seconds after the previous clip of the layer
 * installed), the animation (null for an empty entry) and its reference length
 */
export interface AssembledClip {
  blend: AdbBlend
  animation: AdbAnimation | null
  loop: boolean
  referenceLength: number
}

/**
 * The layers of a fragment change: the transitions' layers, then the fragment's (Cry `CAnimationDatabase::Query`
 * with `AppendBlend` / `AppendLayers`, animation layers only)
 */
export interface AssembledFragment {
  layers: AssembledClip[][]
  /**
   * Seconds of the transitions
   */
  transitionDuration: number
  /**
   * Seconds of the fragment after the transitions: its first layer's exit times plus the last reference length
   */
  fragmentDuration: number
  /**
   * The last clip of the fragment's first layer does not loop
   */
  oneShot: boolean
}

/**
 * Builds the clip sequences of a fragment change
 *
 * @param duration - seconds of an animation by name, null when unknown
 */
export function assembleFragment(
  transitions: TransitionChoice[],
  fragment: AdbFragment | null,
  duration: (name: string) => number | null,
): AssembledFragment {
  const layers: AssembledClip[][] = []
  const state = { oneShot: true }
  let timeTally = 0
  let timeOffset = 0
  for (const transition of transitions) {
    timeTally += appendLayers(layers, transition.fragment.animLayers, timeTally, 0, true, state, duration)
    timeOffset = transition.enterTime
  }
  let fragmentDuration = 0
  if (fragment) {
    fragmentDuration = appendLayers(layers, fragment.animLayers, timeTally, timeOffset, false, state, duration)
  }
  return { layers, transitionDuration: timeTally, fragmentDuration, oneShot: state.oneShot }
}

/**
 * Cry `AppendLayers` for animation layers: a part's clips are appended to each layer. When the layer's last blend has
 * an exit time at or after the part's start (or is `terminal`), the part's first clip takes its place: a transition's
 * terminal blend sets the blend of the fragment's first clip, a transition merges its first blend over a dangling one.
 *
 * @returns the part's duration from its first layer
 */
function appendLayers(
  out: AssembledClip[][],
  layers: AdbAnimLayer[],
  startTime: number,
  startOffset: number,
  isBlend: boolean,
  state: { oneShot: boolean },
  durationOf: (name: string) => number | null,
): number {
  let totalTime = 0
  let calcTime = true
  while (out.length < layers.length) {
    out.push([])
  }
  for (let i = 0; i < layers.length; i++) {
    const layer = out[i]
    const source = layers[i].sequence
    const oldLength = layer.length
    const fragLength = source.length
    let startIdx = oldLength
    let shouldOverride = false
    if (oldLength > 0 && fragLength > 0) {
      const prevBlend = layer[oldLength - 1].blend
      shouldOverride = prevBlend.exitTime >= startTime || prevBlend.terminal
      if (shouldOverride) {
        startIdx = Math.max(startIdx - 1, 0)
      }
    }
    const installLength = isBlend ? Math.max(fragLength, 1) : fragLength
    let lastDuration = 0
    let layerTotalTime = 0
    for (let k = 0; k < installLength; k++) {
      const firstClip = k === 0
      const item = source[k] ?? { blend: nullBlend(), animation: null }
      const index = startIdx + k
      const clip: AssembledClip = layer[index] ?? {
        blend: nullBlend(),
        animation: null,
        loop: false,
        referenceLength: 0,
      }
      layer[index] = clip
      clip.animation = item.animation?.name ? item.animation : null
      if (shouldOverride && firstClip) {
        if (isBlend) {
          clip.blend = { ...item.blend, exitTime: clip.blend.exitTime }
        }
      } else {
        clip.blend = { ...item.blend }
        if (firstClip) {
          clip.blend.exitTime = Math.max(clip.blend.exitTime, 0) + startTime
        }
      }
      const animation = clip.animation
      clip.loop = !!animation?.flags.some((it) => it.toLowerCase() === 'loop')
      let animDuration = 0
      if (animation && !clip.loop && animation.speed > 0) {
        const seconds = durationOf(animation.name)
        if (seconds != null) {
          animDuration = (seconds - clip.blend.startTime) / animation.speed
        }
      }
      clip.referenceLength = animDuration
      if (clip.blend.exitTime < 0) {
        clip.blend.exitTime = lastDuration
      }
      if (calcTime) {
        totalTime += clip.blend.exitTime
      }
      if (!isBlend) {
        const previousStartTime = layerTotalTime
        layerTotalTime += clip.blend.exitTime
        const animStartTime = layerTotalTime
        if (i === 0) {
          state.oneShot = !clip.loop
        }
        if (startOffset > animStartTime) {
          // the transition's enter time clips the start of the animation
          clip.blend.startTime += (startOffset - animStartTime) / Math.max(animDuration, 0.001)
          clip.blend.startTime = Math.min(1, Math.max(0, clip.blend.startTime))
          clip.blend.exitTime = 0
        } else if (startOffset > previousStartTime) {
          clip.blend.exitTime = Math.max(0, clip.blend.exitTime - (startOffset - previousStartTime))
        }
      }
      lastDuration = animDuration
    }
    layer.length = startIdx + installLength
    if (calcTime && !isBlend) {
      totalTime += lastDuration
    }
    calcTime = false
  }
  // layers the part leaves out: a dangling entry of the previous part ends at the part's start
  for (let i = layers.length; i < out.length; i++) {
    const layer = out[i]
    const last = layer[layer.length - 1]
    if (last && !(last.blend.exitTime >= startTime || last.blend.terminal)) {
      layer.push({ blend: { ...nullBlend(), exitTime: startTime }, animation: null, loop: false, referenceLength: 0 })
    }
  }
  return totalTime - startTime
}

function nullBlend(): AdbBlend {
  return { exitTime: 0, startTime: 0, duration: MANNEQUIN_BLEND_DURATION, curveType: 0, flags: [], terminal: false }
}
