import type { WwiseBank, WwiseHircEntry } from './bank'
import { readNodeBase, type WwiseGraphPoint, type WwiseNodeBase } from './nodebase'
import { WwiseReader } from './reader'

/**
 * HIRC object types (bank version 150)
 */
export const WwiseHircType = {
  State: 1,
  Sound: 2,
  Action: 3,
  Event: 4,
  RanSeqCntr: 5,
  SwitchCntr: 6,
  ActorMixer: 7,
  Bus: 8,
  LayerCntr: 9,
  MusicSegment: 10,
  MusicTrack: 11,
  MusicSwitch: 12,
  MusicRanSeq: 13,
  Attenuation: 14,
} as const

export interface WwiseSource {
  pluginId: number
  /**
   * 0 = embedded in a bank, 1 = prefetch + streamed, 2 = streamed (loose `.wem`)
   */
  streamType: number
  mediaId: number
  inMemorySize: number
  bits: number
}

export interface WwiseEvent {
  type: typeof WwiseHircType.Event
  id: number
  actions: number[]
}

export interface WwiseAction {
  type: typeof WwiseHircType.Action
  id: number
  /**
   * `ulActionType`, high byte is the action kind (0x04 play, 0x01 stop, 0x1e seek, ...)
   */
  actionType: number
  targetId: number
  /**
   * the target is a bus
   */
  isBus: boolean
}

export interface WwiseSound {
  type: typeof WwiseHircType.Sound
  id: number
  source: WwiseSource
  node: WwiseNodeBase
}

export interface WwiseRanSeqCntr {
  type: typeof WwiseHircType.RanSeqCntr
  id: number
  node: WwiseNodeBase
  loopCount: number
  transitionTime: number
  avoidRepeatCount: number
  transitionMode: number
  /**
   * 0 normal, 1 shuffle
   */
  randomMode: number
  /**
   * 0 random, 1 sequence
   */
  mode: number
  flags: number
  children: number[]
  playlist: { id: number; weight: number }[]
}

export interface WwiseSwitchCntr {
  type: typeof WwiseHircType.SwitchCntr
  id: number
  node: WwiseNodeBase
  /**
   * 0 switch, 1 state
   */
  groupType: number
  groupId: number
  defaultSwitch: number
  children: number[]
  packages: { switchId: number; nodes: number[] }[]
}

export interface WwiseLayerCntr {
  type: typeof WwiseHircType.LayerCntr | typeof WwiseHircType.ActorMixer
  id: number
  node: WwiseNodeBase
  children: number[]
}

export interface WwiseMusicNode {
  flags: number
  node: WwiseNodeBase
  children: number[]
  tempo: number
}

export interface WwiseMusicTrack {
  type: typeof WwiseHircType.MusicTrack
  id: number
  flags: number
  sources: WwiseSource[]
  playlist: WwiseTrackSrcInfo[]
  subTracks: number
  clipAutomation: { clipIndex: number; autoType: number; points: WwiseGraphPoint[] }[]
  node: WwiseNodeBase
  /**
   * 0 normal, 1 random, 2 sequence, 3 switch
   */
  trackType: number
  lookAheadTime: number
}

export interface WwiseTrackSrcInfo {
  trackId: number
  sourceId: number
  eventId: number
  playAt: number
  beginTrimOffset: number
  endTrimOffset: number
  srcDuration: number
}

export interface WwiseMusicSegment {
  type: typeof WwiseHircType.MusicSegment
  id: number
  music: WwiseMusicNode
  duration: number
  markers: { id: number; position: number; name: string }[]
}

export interface WwiseMusicSwitch {
  type: typeof WwiseHircType.MusicSwitch
  id: number
  music: WwiseMusicNode
  continuePlayback: boolean
  /**
   * switch/state group ids of the decision tree arguments, in tree depth order
   */
  arguments: { groupId: number; groupType: number }[]
  mode: number
  tree: WwiseDecisionNode
}

export interface WwiseDecisionNode {
  /**
   * switch/state value id, 0 is the wildcard `*`
   */
  key: number
  /**
   * audio node id for leaves
   */
  audioNodeId?: number
  children?: WwiseDecisionNode[]
  weight: number
  probability: number
}

export interface WwiseMusicRanSeq {
  type: typeof WwiseHircType.MusicRanSeq
  id: number
  music: WwiseMusicNode
  playlist: WwiseMusicPlaylistItem
}

export interface WwiseMusicPlaylistItem {
  segmentId: number
  playlistItemId: number
  /**
   * 0 sequence continuous, 1 sequence step, 2 random continuous, 3 random step, 0xffffffff segment
   */
  rsType: number
  loop: number
  weight: number
  avoidRepeatCount: number
  isUsingWeight: boolean
  isShuffle: boolean
  children: WwiseMusicPlaylistItem[]
}

/**
 * Object types without a typed parser, `rawType` holds the HIRC type
 */
export interface WwiseUnknownObject {
  type: 0
  rawType: number
  id: number
}

export type WwiseHircObject =
  | WwiseEvent
  | WwiseAction
  | WwiseSound
  | WwiseRanSeqCntr
  | WwiseSwitchCntr
  | WwiseLayerCntr
  | WwiseMusicTrack
  | WwiseMusicSegment
  | WwiseMusicSwitch
  | WwiseMusicRanSeq
  | WwiseUnknownObject

/**
 * Parses a HIRC object body. Throws {@link WwiseReadError} when the body is truncated or not consumed exactly,
 * which means the layout does not match (unknown variant or version).
 */
export function parseHircObject(bank: WwiseBank, entry: WwiseHircEntry): WwiseHircObject {
  const r = new WwiseReader(bank.bytes, entry.offset, entry.size)
  const result = readObject(r, entry)
  if (result && r.remaining !== 0 && isTyped(entry.type)) {
    throw new Error(`HIRC ${entry.type} ${entry.id}: ${r.remaining} bytes not consumed`)
  }
  return result
}

function isTyped(type: number) {
  return (
    type === WwiseHircType.Sound ||
    type === WwiseHircType.RanSeqCntr ||
    type === WwiseHircType.SwitchCntr ||
    type === WwiseHircType.LayerCntr ||
    type === WwiseHircType.ActorMixer ||
    type === WwiseHircType.MusicTrack ||
    type === WwiseHircType.MusicSegment ||
    type === WwiseHircType.MusicSwitch ||
    type === WwiseHircType.MusicRanSeq ||
    type === WwiseHircType.Event
  )
}

function readObject(r: WwiseReader, { type, id }: WwiseHircEntry): WwiseHircObject {
  switch (type) {
    case WwiseHircType.Event: {
      const count = r.var()
      const actions: number[] = []
      for (let i = 0; i < count; i++) {
        actions.push(r.u32())
      }
      return { type, id, actions }
    }
    case WwiseHircType.Action: {
      const actionType = r.u16()
      const targetId = r.u32()
      const isBus = (r.u8() & 1) !== 0
      return { type, id, actionType, targetId, isBus }
    }
    case WwiseHircType.Sound: {
      const source = readSource(r)
      const node = readNodeBase(r)
      return { type, id, source, node }
    }
    case WwiseHircType.RanSeqCntr: {
      const node = readNodeBase(r)
      const loopCount = r.u16()
      r.u16() // loop mod min
      r.u16() // loop mod max
      const transitionTime = r.f32()
      r.f32() // transition mod min
      r.f32() // transition mod max
      const avoidRepeatCount = r.u16()
      const transitionMode = r.u8()
      const randomMode = r.u8()
      const mode = r.u8()
      const flags = r.u8()
      const children = readChildren(r)
      const count = r.count(r.u16(), 8, 'playlist')
      const playlist: { id: number; weight: number }[] = []
      for (let i = 0; i < count; i++) {
        playlist.push({ id: r.u32(), weight: r.u32() })
      }
      return {
        type,
        id,
        node,
        loopCount,
        transitionTime,
        avoidRepeatCount,
        transitionMode,
        randomMode,
        mode,
        flags,
        children,
        playlist,
      }
    }
    case WwiseHircType.SwitchCntr: {
      const node = readNodeBase(r)
      const groupType = r.u8()
      const groupId = r.u32()
      const defaultSwitch = r.u32()
      r.u8() // bIsContinuousValidation
      const children = readChildren(r)
      const numGroups = r.count(r.u32(), 8, 'switch packages')
      const packages: { switchId: number; nodes: number[] }[] = []
      for (let i = 0; i < numGroups; i++) {
        const switchId = r.u32()
        packages.push({ switchId, nodes: readChildren(r) })
      }
      const numParams = r.count(r.u32(), 14, 'switch params')
      r.skip(numParams * 14)
      return { type, id, node, groupType, groupId, defaultSwitch, children, packages }
    }
    case WwiseHircType.LayerCntr: {
      const node = readNodeBase(r)
      const children = readChildren(r)
      const numLayers = r.count(r.u32(), 9, 'layers')
      for (let i = 0; i < numLayers; i++) {
        r.u32() // layer id
        readRtpcs(r)
        r.u32() // rtpc id
        r.u8() // rtpc type
        const numAssoc = r.count(r.u32(), 8, 'layer assoc')
        for (let j = 0; j < numAssoc; j++) {
          r.u32() // associated child
          const points = r.count(r.u32(), 12, 'layer curve')
          r.skip(points * 12)
        }
      }
      r.u8() // bIsContinuousValidation
      return { type, id, node, children }
    }
    case WwiseHircType.ActorMixer: {
      const node = readNodeBase(r)
      const children = readChildren(r)
      return { type, id, node, children }
    }
    case WwiseHircType.MusicTrack: {
      return readMusicTrack(r, id)
    }
    case WwiseHircType.MusicSegment: {
      const music = readMusicNode(r)
      const duration = r.f64()
      const numMarkers = r.count(r.u32(), 13, 'markers')
      const markers: { id: number; position: number; name: string }[] = []
      for (let i = 0; i < numMarkers; i++) {
        const markerId = r.u32()
        const position = r.f64()
        // NUL terminated marker name (e.g. "MK1"), empty names are a single 0 byte
        let name = ''
        for (let c = r.u8(); c !== 0; c = r.u8()) {
          name += String.fromCharCode(c)
        }
        markers.push({ id: markerId, position, name })
      }
      return { type, id, music, duration, markers }
    }
    case WwiseHircType.MusicSwitch: {
      const music = readMusicTransNode(r)
      const continuePlayback = r.u8() !== 0
      const depth = r.count(r.u32(), 5, 'tree depth')
      const args: { groupId: number; groupType: number }[] = []
      for (let i = 0; i < depth; i++) {
        args.push({ groupId: r.u32(), groupType: 0 })
      }
      for (let i = 0; i < depth; i++) {
        args[i].groupType = r.u8()
      }
      const treeSize = r.u32()
      const mode = r.u8()
      const treeEnd = r.offset + treeSize
      const tree = readDecisionTree(r, treeSize, depth)
      r.offset = treeEnd
      return { type, id, music, continuePlayback, arguments: args, mode, tree }
    }
    case WwiseHircType.MusicRanSeq: {
      const music = readMusicTransNode(r)
      const count = r.count(r.u32(), 30, 'music playlist')
      const playlist = readMusicPlaylistItem(r)
      if (countPlaylist(playlist) !== count) {
        throw new Error(`music playlist count ${count} does not match the parsed tree`)
      }
      return { type, id, music, playlist }
    }
  }
  return { type: 0, rawType: type, id }
}

function readSource(r: WwiseReader): WwiseSource {
  const pluginId = r.u32()
  const streamType = r.u8()
  const mediaId = r.u32()
  const inMemorySize = r.u32()
  const bits = r.u8()
  // source plugins (plugin type nibble 2) carry a parameter blob
  if ((pluginId & 0x0f) === 0x02) {
    const size = r.u32()
    r.skip(size)
  }
  return { pluginId, streamType, mediaId, inMemorySize, bits }
}

function readChildren(r: WwiseReader) {
  const count = r.count(r.u32(), 4, 'children')
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    result.push(r.u32())
  }
  return result
}

function readRtpcs(r: WwiseReader) {
  const count = r.count(r.u16(), 14, 'rtpc curves')
  for (let i = 0; i < count; i++) {
    r.u32()
    r.u8()
    r.u8()
    r.var()
    r.u32()
    r.u8()
    const points = r.count(r.u16(), 12, 'rtpc points')
    r.skip(points * 12)
  }
}

function readMusicNode(r: WwiseReader): WwiseMusicNode {
  const flags = r.u8()
  const node = readNodeBase(r)
  const children = readChildren(r)
  // AkMeterInfo
  r.f64() // grid period
  r.f64() // grid offset
  const tempo = r.f32()
  r.u8() // beats per bar
  r.u8() // beat value
  r.u8() // bMeterInfoFlag
  const numStingers = r.count(r.u32(), 24, 'stingers')
  r.skip(numStingers * 24)
  return { flags, node, children, tempo }
}

function readMusicTransNode(r: WwiseReader): WwiseMusicNode {
  const music = readMusicNode(r)
  const numRules = r.count(r.u32(), 8, 'transition rules')
  for (let i = 0; i < numRules; i++) {
    const numSrc = r.count(r.u32(), 4, 'rule sources')
    r.skip(numSrc * 4)
    const numDst = r.count(r.u32(), 4, 'rule destinations')
    r.skip(numDst * 4)
    // AkMusicTransSrcRule: fade (time, curve, offset), sync type, cue filter, play post exit
    r.skip(12 + 4 + 4 + 1)
    // AkMusicTransDstRule: fade, cue filter, jump to id, jump to type, entry type, play pre entry, match cue name
    r.skip(12 + 4 + 4 + 2 + 2 + 1 + 1)
    const hasTransObject = r.u8()
    if (hasTransObject) {
      // segment id, fade in, fade out, play pre entry, play post exit
      r.skip(4 + 12 + 12 + 1 + 1)
    }
  }
  return music
}

function readMusicTrack(r: WwiseReader, id: number): WwiseMusicTrack {
  const flags = r.u8()
  const numSources = r.count(r.u32(), 14, 'track sources')
  const sources: WwiseSource[] = []
  for (let i = 0; i < numSources; i++) {
    sources.push(readSource(r))
  }
  const numPlaylist = r.count(r.u32(), 44, 'track playlist')
  const playlist: WwiseTrackSrcInfo[] = []
  for (let i = 0; i < numPlaylist; i++) {
    playlist.push({
      trackId: r.u32(),
      sourceId: r.u32(),
      eventId: r.u32(),
      playAt: r.f64(),
      beginTrimOffset: r.f64(),
      endTrimOffset: r.f64(),
      srcDuration: r.f64(),
    })
  }
  const subTracks = numPlaylist > 0 ? r.u32() : 0
  const numClips = r.count(r.u32(), 12, 'clip automation')
  const clipAutomation: WwiseMusicTrack['clipAutomation'] = []
  for (let i = 0; i < numClips; i++) {
    const clipIndex = r.u32()
    const autoType = r.u32()
    const numPoints = r.count(r.u32(), 12, 'clip points')
    const points: WwiseGraphPoint[] = []
    for (let j = 0; j < numPoints; j++) {
      points.push({ from: r.f32(), to: r.f32(), interp: r.u32() })
    }
    clipAutomation.push({ clipIndex, autoType, points })
  }
  const node = readNodeBase(r)
  const trackType = r.u8()
  if (trackType === 3) {
    // AkTrackSwitchParams
    r.u8() // group type
    r.u32() // group id
    r.u32() // default switch
    const numAssoc = r.count(r.u32(), 4, 'track switch assoc')
    r.skip(numAssoc * 4)
    // AkTransParams: src fade, sync type, cue filter, dst fade
    r.skip(12 + 4 + 4 + 12)
  }
  const lookAheadTime = r.i32()
  return {
    type: WwiseHircType.MusicTrack,
    id,
    flags,
    sources,
    playlist,
    subTracks,
    clipAutomation,
    node,
    trackType,
    lookAheadTime,
  }
}

function readDecisionTree(r: WwiseReader, size: number, depth: number): WwiseDecisionNode {
  const count = size / 12
  if (!Number.isInteger(count)) {
    throw new Error(`decision tree size ${size} is not a multiple of 12`)
  }
  const base = r.offset
  const view = r.view
  const node = (index: number, level: number): WwiseDecisionNode => {
    if (index >= count) {
      throw new Error(`decision tree node ${index} out of ${count}`)
    }
    const at = base + index * 12
    const key = view.getUint32(at, true)
    const weight = view.getUint16(at + 8, true)
    const probability = view.getUint16(at + 10, true)
    const first = view.getUint16(at + 4, true)
    const num = view.getUint16(at + 6, true)
    // a tree may hold just a root that already points at an audio node (single default path)
    if (level === depth || first + num > count || first <= index) {
      return { key, audioNodeId: view.getUint32(at + 4, true), weight, probability }
    }
    const children: WwiseDecisionNode[] = []
    for (let i = 0; i < num; i++) {
      children.push(node(first + i, level + 1))
    }
    return { key, children, weight, probability }
  }
  r.skip(size)
  return node(0, 0)
}

function readMusicPlaylistItem(r: WwiseReader): WwiseMusicPlaylistItem {
  const segmentId = r.u32()
  const playlistItemId = r.u32()
  const numChildren = r.u32()
  const rsType = r.u32()
  const loop = r.i16()
  r.i16() // loop min
  r.i16() // loop max
  const weight = r.u32()
  const avoidRepeatCount = r.u16()
  const isUsingWeight = r.u8() !== 0
  const isShuffle = r.u8() !== 0
  const children: WwiseMusicPlaylistItem[] = []
  r.count(numChildren, 30, 'music playlist children')
  for (let i = 0; i < numChildren; i++) {
    children.push(readMusicPlaylistItem(r))
  }
  return { segmentId, playlistItemId, rsType, loop, weight, avoidRepeatCount, isUsingWeight, isShuffle, children }
}

function countPlaylist(item: WwiseMusicPlaylistItem): number {
  return 1 + item.children.reduce((sum, child) => sum + countPlaylist(child), 0)
}
