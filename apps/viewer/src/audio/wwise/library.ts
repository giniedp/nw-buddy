import { parseWwiseBank, type WwiseBank, type WwiseHircEntry } from './bank'
import { wwiseShortId } from './hash'
import {
  parseHircObject,
  WwiseHircType,
  type WwiseDecisionNode,
  type WwiseHircObject,
  type WwiseMusicPlaylistItem,
} from './hirc'
import type { WwiseNodeBase } from './nodebase'

/**
 * Loaded banks with a cross bank object index. Wwise resolves objects by id across all loaded banks,
 * e.g. an event in `x_events.bnk` plays a container whose media lives in `x.bnk`.
 */
export class WwiseLibrary {
  public readonly banks = new Map<string, WwiseBank>()
  private index = new Map<number, { bank: WwiseBank; entry: WwiseHircEntry }>()
  private parsed = new Map<number, WwiseHircObject>()
  private mediaIndex = new Map<number, WwiseBank>()

  public addBank(name: string, data: ArrayBufferLike | Uint8Array) {
    const key = name.toLowerCase()
    if (this.banks.has(key)) {
      return this.banks.get(key)
    }
    const bank = parseWwiseBank(data)
    this.banks.set(key, bank)
    for (const entry of bank.hirc) {
      if (!this.index.has(entry.id)) {
        this.index.set(entry.id, { bank, entry })
      }
    }
    for (const id of bank.media.keys()) {
      if (!this.mediaIndex.has(id)) {
        this.mediaIndex.set(id, bank)
      }
    }
    return bank
  }

  public removeBank(name: string) {
    const key = name.toLowerCase()
    const bank = this.banks.get(key)
    if (!bank) {
      return
    }
    this.banks.delete(key)
    for (const entry of bank.hirc) {
      if (this.index.get(entry.id)?.bank === bank) {
        this.index.delete(entry.id)
        this.parsed.delete(entry.id)
      }
    }
    for (const id of bank.media.keys()) {
      if (this.mediaIndex.get(id) === bank) {
        this.mediaIndex.delete(id)
      }
    }
    // other banks may define the same objects
    for (const other of this.banks.values()) {
      for (const entry of other.hirc) {
        if (!this.index.has(entry.id)) {
          this.index.set(entry.id, { bank: other, entry })
        }
      }
      for (const id of other.media.keys()) {
        if (!this.mediaIndex.has(id)) {
          this.mediaIndex.set(id, other)
        }
      }
    }
  }

  public getObject(id: number): WwiseHircObject | null {
    if (this.parsed.has(id)) {
      return this.parsed.get(id)
    }
    const found = this.index.get(id)
    if (!found) {
      return null
    }
    const object = parseHircObject(found.bank, found.entry)
    this.parsed.set(id, object)
    return object
  }

  /**
   * The bank that embeds the given media, if any is loaded
   */
  public getMediaBank(mediaId: number): WwiseBank | null {
    return this.mediaIndex.get(mediaId) || null
  }

  public hasEvent(name: string) {
    return this.getObject(wwiseShortId(name))?.type === WwiseHircType.Event
  }

  /**
   * Builds the playback tree of an event's play actions
   */
  public buildEventTree(name: string): WwiseEventTree | null {
    const event = this.getObject(wwiseShortId(name))
    if (!event || event.type !== WwiseHircType.Event) {
      return null
    }
    const actions: WwiseEventTree['actions'] = []
    for (const actionId of event.actions) {
      const action = this.getObject(actionId)
      if (!action || action.type !== WwiseHircType.Action) {
        actions.push({ actionType: -1, targetId: actionId, node: { kind: 'missing', id: actionId } })
        continue
      }
      const kind = action.actionType >> 8
      actions.push({
        actionType: action.actionType,
        targetId: action.targetId,
        node: kind === 0x04 || kind === 0x05 ? this.buildNode(action.targetId, new Set()) : null,
      })
    }
    return { name, id: event.id, actions }
  }

  private buildNode(id: number, visiting: Set<number>): WwisePlayNode {
    const object = this.getObject(id)
    if (!object) {
      return { kind: 'missing', id }
    }
    if (visiting.has(id)) {
      return { kind: 'cycle', id }
    }
    visiting.add(id)
    try {
      return this.buildTyped(object, visiting)
    } finally {
      visiting.delete(id)
    }
  }

  private buildTyped(object: WwiseHircObject, visiting: Set<number>): WwisePlayNode {
    const child = (id: number) => this.buildNode(id, visiting)
    switch (object.type) {
      case WwiseHircType.Sound: {
        return {
          kind: 'sound',
          id: object.id,
          media: this.mediaRef(object.source.mediaId, object.source.streamType),
          ...nodeInfo(object.node),
        }
      }
      case WwiseHircType.RanSeqCntr: {
        return {
          kind: 'random',
          id: object.id,
          mode: object.mode === 1 ? 'sequence' : object.randomMode === 1 ? 'shuffle' : 'random',
          continuous: (object.flags & 0x08) !== 0,
          avoidRepeatCount: object.avoidRepeatCount,
          transitionTime: object.transitionTime,
          transitionMode: object.transitionMode,
          loopCount: object.loopCount,
          items: object.playlist.map((item) => ({
            weight: (object.flags & 1) !== 0 ? item.weight : 1,
            node: child(item.id),
          })),
          ...nodeInfo(object.node),
        }
      }
      case WwiseHircType.SwitchCntr: {
        return {
          kind: 'switch',
          id: object.id,
          groupType: object.groupType === 1 ? 'state' : 'switch',
          groupId: object.groupId,
          defaultSwitch: object.defaultSwitch,
          branches: object.packages.map((p) => ({ key: p.switchId, nodes: p.nodes.map(child) })),
          ...nodeInfo(object.node),
        }
      }
      case WwiseHircType.LayerCntr:
      case WwiseHircType.ActorMixer: {
        return { kind: 'layer', id: object.id, children: object.children.map(child), ...nodeInfo(object.node) }
      }
      case WwiseHircType.MusicSwitch: {
        return {
          kind: 'musicSwitch',
          id: object.id,
          arguments: object.arguments.map((a) => ({
            groupId: a.groupId,
            groupType: a.groupType === 1 ? 'state' : 'switch',
          })),
          tree: this.buildDecision(object.tree, visiting),
          ...nodeInfo(object.music.node),
        }
      }
      case WwiseHircType.MusicRanSeq: {
        return {
          kind: 'musicPlaylist',
          id: object.id,
          playlist: this.buildPlaylist(object.playlist, visiting),
          ...nodeInfo(object.music.node),
        }
      }
      case WwiseHircType.MusicSegment: {
        return {
          kind: 'musicSegment',
          id: object.id,
          duration: object.duration,
          markers: object.markers.map((m) => ({ id: m.id, position: m.position })),
          tracks: object.music.children.map(child),
          ...nodeInfo(object.music.node),
        }
      }
      case WwiseHircType.MusicTrack: {
        return {
          kind: 'musicTrack',
          id: object.id,
          trackType: object.trackType,
          clips: object.playlist.map((clip) => ({
            media: this.mediaRef(
              clip.sourceId,
              object.sources.find((s) => s.mediaId === clip.sourceId)?.streamType ?? 0,
            ),
            playAt: clip.playAt,
            beginTrimOffset: clip.beginTrimOffset,
            endTrimOffset: clip.endTrimOffset,
            srcDuration: clip.srcDuration,
            subTrack: clip.trackId,
          })),
          ...nodeInfo(object.node),
        }
      }
    }
    return { kind: 'unsupported', id: object.id, type: object.type === 0 ? object.rawType : object.type }
  }

  private buildDecision(node: WwiseDecisionNode, visiting: Set<number>): WwiseDecisionBranch {
    if (node.audioNodeId !== undefined) {
      return { key: node.key, node: node.audioNodeId ? this.buildNode(node.audioNodeId, visiting) : null }
    }
    return { key: node.key, children: node.children.map((c) => this.buildDecision(c, visiting)) }
  }

  private buildPlaylist(item: WwiseMusicPlaylistItem, visiting: Set<number>): WwiseMusicPlaylistNode {
    return {
      rsType: item.rsType,
      loop: item.loop,
      weight: item.weight,
      avoidRepeatCount: item.avoidRepeatCount,
      isShuffle: item.isShuffle,
      segment: item.segmentId ? this.buildNode(item.segmentId, visiting) : null,
      children: item.children.map((c) => this.buildPlaylist(c, visiting)),
    }
  }

  private mediaRef(mediaId: number, streamType: number): WwiseMediaRef {
    const bank = this.mediaIndex.get(mediaId)
    let bankName: string = null
    if (bank) {
      for (const [name, b] of this.banks) {
        if (b === bank) {
          bankName = name
        }
      }
    }
    return { id: mediaId, streamed: streamType !== 0, bank: bankName }
  }
}

function nodeInfo(node: WwiseNodeBase) {
  const props: Record<number, number> = {}
  for (const [id, value] of node.props) {
    props[id] = Number.isInteger(value) || Math.abs(value) > 1e-6 ? value : node.propsRaw.get(id)
  }
  return {
    props,
    is3d: node.positioning.is3d,
    rtpcs: node.rtpcs.map((c) => ({ rtpcId: c.rtpcId, paramId: c.paramId, points: c.points })),
    stateGroups: node.stateGroups,
  }
}

export interface WwiseMediaRef {
  id: number
  /**
   * media is streamed from a loose `sounds/wwise/media/<id>.wem` (possibly with a prefetch in a bank)
   */
  streamed: boolean
  /**
   * the loaded bank embedding the media (or its prefetch), null if none is loaded
   */
  bank: string | null
}

export interface WwiseEventTree {
  name: string
  id: number
  actions: { actionType: number; targetId: number; node: WwisePlayNode | null }[]
}

export interface WwiseDecisionBranch {
  key: number
  node?: WwisePlayNode | null
  children?: WwiseDecisionBranch[]
}

export interface WwiseMusicPlaylistNode {
  rsType: number
  loop: number
  weight: number
  avoidRepeatCount: number
  isShuffle: boolean
  segment: WwisePlayNode | null
  children: WwiseMusicPlaylistNode[]
}

interface NodeInfo {
  props: Record<number, number>
  is3d: boolean
  rtpcs: { rtpcId: number; paramId: number; points: { from: number; to: number; interp: number }[] }[]
  stateGroups: number[]
}

export type WwisePlayNode =
  | { kind: 'missing'; id: number }
  | { kind: 'cycle'; id: number }
  | { kind: 'unsupported'; id: number; type: number }
  | ({ kind: 'sound'; id: number; media: WwiseMediaRef } & NodeInfo)
  | ({
      kind: 'random'
      id: number
      mode: 'random' | 'shuffle' | 'sequence'
      continuous: boolean
      avoidRepeatCount: number
      transitionTime: number
      transitionMode: number
      loopCount: number
      items: { weight: number; node: WwisePlayNode }[]
    } & NodeInfo)
  | ({
      kind: 'switch'
      id: number
      groupType: 'switch' | 'state'
      groupId: number
      defaultSwitch: number
      branches: { key: number; nodes: WwisePlayNode[] }[]
    } & NodeInfo)
  | ({ kind: 'layer'; id: number; children: WwisePlayNode[] } & NodeInfo)
  | ({
      kind: 'musicSwitch'
      id: number
      arguments: { groupId: number; groupType: 'switch' | 'state' }[]
      tree: WwiseDecisionBranch
    } & NodeInfo)
  | ({ kind: 'musicPlaylist'; id: number; playlist: WwiseMusicPlaylistNode } & NodeInfo)
  | ({
      kind: 'musicSegment'
      id: number
      duration: number
      markers: { id: number; position: number }[]
      tracks: WwisePlayNode[]
    } & NodeInfo)
  | ({
      kind: 'musicTrack'
      id: number
      trackType: number
      clips: {
        media: WwiseMediaRef
        playAt: number
        beginTrimOffset: number
        endTrimOffset: number
        srcDuration: number
        subTrack: number
      }[]
    } & NodeInfo)
