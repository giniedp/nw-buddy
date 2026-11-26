import { parseXmlRoot, xmlAttr, xmlBool, xmlChild, xmlChildren, xmlNumber } from '../xml/cryXml'
import { splitTags } from './tags'

/**
 * Mannequin defaults (Lumberyard ICryMannequin.h SAnimBlend, SAnimationEntry, CFragment)
 */
export const MANNEQUIN_BLEND_DURATION = 0.2
export const MANNEQUIN_BLEND_OUT_DURATION = 0.2

/**
 * A blend before a clip (SAnimBlend), defaults applied
 */
export interface AdbBlend {
  /**
   * Seconds after the previous clip started, negative: after the previous clip ends
   */
  exitTime: number
  /**
   * Seconds into the clip to start at
   */
  startTime: number
  duration: number
  curveType: number
  /**
   * Blend flags, e.g. `TimeWarping`, `Idle2Move`
   */
  flags: string[]
  terminal: boolean
}

/**
 * An animation of a layer (SAnimationEntry), defaults applied
 */
export interface AdbAnimation {
  /**
   * The animation name (chrparams), empty to stop the layer
   */
  name: string
  /**
   * Animation flags, e.g. `Loop`, `RepeatLast`
   */
  flags: string[]
  speed: number
  weight: number
  weightList: number
  /**
   * Blend channels `channel0`..`channel3`
   */
  channels: number[]
}

export interface AdbProcedural {
  type: string
  contextType: string
  /**
   * ProceduralParams by name: the `value` attribute, or the values of its `Element` children (vectors)
   */
  params: Record<string, string | string[]>
}

/**
 * A layer as authored: each clip with the blend before it. A blend without a clip ends the sequence.
 */
export interface AdbAnimLayer {
  sequence: Array<{ blend: AdbBlend; animation: AdbAnimation | null }>
}

export interface AdbProcLayer {
  sequence: Array<{ blend: AdbBlend; procedural: AdbProcedural | null }>
}

/**
 * A variant of a fragment
 */
export interface AdbFragment {
  /**
   * The tags the variant needs, all of them set
   */
  tags: string[]
  /**
   * The fragment's own tags (of the fragment's sub tag definition)
   */
  fragTags: string[]
  blendOutDuration: number
  animLayers: AdbAnimLayer[]
  procLayers: AdbProcLayer[]
}

/**
 * Transitions between two fragments (`FragmentBlendList/Blend`)
 */
export interface AdbFragmentBlend {
  /**
   * Fragment names, empty for any
   */
  from: string
  to: string
  variants: Array<{
    fromTags: string[]
    toTags: string[]
    fromFragTags: string[]
    toFragTags: string[]
    fragments: Array<{ selectTime: number; enterTime: number; fragment: AdbFragment }>
  }>
}

/**
 * An `<AnimDB>` (`.adb`): fragment variants by tags, transitions and sub databases
 */
export interface AdbDocument {
  /**
   * The fragment id definition (a tag definition)
   */
  fragDef: string
  /**
   * The tag definition
   */
  tagDef: string
  /**
   * Databases used instead when their tags are set, for the listed fragments or all
   */
  subDatabases: Array<{ tags: string[]; file: string; fragments: string[] }>
  /**
   * Fragment variants by fragment name, in document order
   */
  fragments: Map<string, AdbFragment[]>
  blends: AdbFragmentBlend[]
}

/**
 * Parses an `.adb` file
 */
export function parseAnimationDatabase(xml: string): AdbDocument {
  const root = parseXmlRoot(xml, 'AnimDB')
  const fragments = new Map<string, AdbFragment[]>()
  for (const group of xmlChildren(xmlChild(root, 'FragmentList'))) {
    const list = fragments.get(group.nodeName) ?? []
    list.push(...xmlChildren(group, 'Fragment').map(readFragment))
    fragments.set(group.nodeName, list)
  }
  return {
    fragDef: xmlAttr(root, 'FragDef') ?? '',
    tagDef: xmlAttr(root, 'TagDef') ?? '',
    subDatabases: xmlChildren(xmlChild(root, 'SubADBs'), 'SubADB').map((it) => ({
      tags: splitTags(xmlAttr(it, 'Tags')),
      file: xmlAttr(it, 'File') ?? '',
      fragments: xmlChildren(it, 'FragmentID').map((fragment) => xmlAttr(fragment, 'Name') ?? ''),
    })),
    fragments,
    blends: xmlChildren(xmlChild(root, 'FragmentBlendList'), 'Blend').map((blend) => ({
      from: xmlAttr(blend, 'from') ?? '',
      to: xmlAttr(blend, 'to') ?? '',
      variants: xmlChildren(blend, 'Variant').map((variant) => ({
        fromTags: splitTags(xmlAttr(variant, 'from')),
        toTags: splitTags(xmlAttr(variant, 'to')),
        fromFragTags: splitTags(xmlAttr(variant, 'fromFrag')),
        toFragTags: splitTags(xmlAttr(variant, 'toFrag')),
        fragments: xmlChildren(variant, 'Fragment').map((fragment) => ({
          selectTime: xmlNumber(fragment, 'selectTime') ?? 0,
          enterTime: xmlNumber(fragment, 'enterTime') ?? 0,
          fragment: readFragment(fragment),
        })),
      })),
    })),
  }
}

/**
 * The variants of a fragment, the name compared without regard to case
 */
export function adbFragmentVariants(adb: AdbDocument, name: string): AdbFragment[] {
  const exact = adb.fragments.get(name)
  if (exact) {
    return exact
  }
  const lower = name.toLowerCase()
  for (const [key, list] of adb.fragments) {
    if (key.toLowerCase() === lower) {
      return list
    }
  }
  return []
}

function readFragment(el: Element): AdbFragment {
  return {
    tags: splitTags(xmlAttr(el, 'Tags')),
    fragTags: splitTags(xmlAttr(el, 'FragTags')),
    blendOutDuration: xmlNumber(el, 'BlendOutDuration') ?? MANNEQUIN_BLEND_OUT_DURATION,
    animLayers: xmlChildren(el, 'AnimLayer').map((layer) => ({
      sequence: readSequence(layer, 'Animation', readAnimation).map((it) => ({ blend: it.blend, animation: it.item })),
    })),
    procLayers: xmlChildren(el, 'ProcLayer').map((layer) => ({
      sequence: readSequence(layer, 'Procedural', readProcedural).map((it) => ({
        blend: it.blend,
        procedural: it.item,
      })),
    })),
  }
}

/**
 * The clips of a layer, each with the blend before it (defaults without one), and a trailing blend without a clip
 */
function readSequence<T>(layer: Element, itemName: string, read: (el: Element) => T) {
  const result: Array<{ blend: AdbBlend; item: T | null }> = []
  let pending: AdbBlend | null = null
  for (const child of xmlChildren(layer)) {
    if (child.nodeName === 'Blend') {
      if (pending) {
        result.push({ blend: pending, item: null })
      }
      pending = readBlend(child)
    } else if (child.nodeName === itemName) {
      result.push({ blend: pending ?? defaultBlend(), item: read(child) })
      pending = null
    }
  }
  if (pending) {
    result.push({ blend: pending, item: null })
  }
  return result
}

function defaultBlend(): AdbBlend {
  return { exitTime: 0, startTime: 0, duration: MANNEQUIN_BLEND_DURATION, curveType: 0, flags: [], terminal: false }
}

function readBlend(el: Element): AdbBlend {
  return {
    exitTime: xmlNumber(el, 'ExitTime') ?? 0,
    startTime: xmlNumber(el, 'StartTime') ?? 0,
    duration: xmlNumber(el, 'Duration') ?? MANNEQUIN_BLEND_DURATION,
    curveType: xmlNumber(el, 'CurveType') ?? 0,
    flags: splitTags(xmlAttr(el, 'flags')),
    terminal: !!xmlBool(el, 'terminal'),
  }
}

function readAnimation(el: Element): AdbAnimation {
  const channels: number[] = []
  for (let i = 0; i < 4; i++) {
    channels.push(xmlNumber(el, `channel${i}`) ?? 0)
  }
  return {
    name: xmlAttr(el, 'name') ?? '',
    flags: splitTags(xmlAttr(el, 'flags')),
    speed: xmlNumber(el, 'speed') ?? 1,
    weight: xmlNumber(el, 'weight') ?? 1,
    weightList: xmlNumber(el, 'weightList') ?? 0,
    channels,
  }
}

function readProcedural(el: Element): AdbProcedural {
  const params: Record<string, string | string[]> = {}
  for (const param of xmlChildren(xmlChild(el, 'ProceduralParams'))) {
    const elements = xmlChildren(param, 'Element')
    if (elements.length) {
      params[param.nodeName] = elements.map((it) => xmlAttr(it, 'value') ?? '')
    } else {
      params[param.nodeName] = xmlAttr(param, 'value') ?? ''
    }
  }
  return {
    type: xmlAttr(el, 'type') ?? '',
    contextType: xmlAttr(el, 'contextType') ?? '',
    params,
  }
}
