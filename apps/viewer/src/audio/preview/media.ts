import {
  parseHircObject,
  wwiseShortId,
  WwiseHircType,
  type WwiseBank,
  type WwiseHircObject,
  type WwiseSource,
} from '../wwise'

/**
 * A media file of a bank, as the preview lists it
 */
export interface BankMedia {
  id: number
  /**
   * embedded: in the bank's `DATA`. streamed: a loose `.wem` (a bank may hold only its prefetch)
   */
  kind: 'embedded' | 'streamed'
  /**
   * Bytes of embedded media, 0 for streamed media (unknown until loaded)
   */
  size: number
  /**
   * The loose `.wem` of streamed media, null when its folder is unknown (see {@link streamedMediaFolder})
   */
  path: string | null
  /**
   * The names of the events that can play it (see {@link mediaEventNames}), empty when none is known
   */
  events: string[]
}

export interface BankContents {
  media: BankMedia[]
  /**
   * Embedded sources of the bank's objects whose media are in other banks (not listed)
   */
  external: number
  /**
   * Objects that could not be parsed, e.g. older bank versions: their streamed media are missing from the list
   */
  unparsed: number
}

const SFX_LANGUAGE = wwiseShortId('SFX')
const WWISE_ROOT = 'sounds/wwise'

/**
 * The folder of the loose `.wem` files a bank streams, from its path and its language (`BKHD`), null if unknown
 *
 * @remarks
 * Found in the game files: the root is the bank path up to `sounds/wwise`; SFX banks stream
 * from `<root>/media`, a language bank from `<root>/media/<language folder>`, where the folder of the bank is the
 * language (its short id is the bank's language id). No language list is needed.
 */
export function streamedMediaFolder(bankPath: string, languageId: number): string | null {
  const at = bankPath.toLowerCase().indexOf(WWISE_ROOT)
  if (at < 0) {
    return null
  }
  const root = bankPath.slice(0, at + WWISE_ROOT.length)
  if (languageId === SFX_LANGUAGE) {
    return `${root}/media`
  }
  const folder = bankPath.split('/').at(-2)
  if (folder && wwiseShortId(folder) === languageId) {
    return `${root}/media/${folder}`
  }
  return null
}

/**
 * The media of a bank: the embedded ones (`DIDX`) and the streamed sources of its sounds and music tracks
 *
 * @param names - the event names of media ids, see {@link mediaEventNames}
 */
export function bankContents(bank: WwiseBank, bankPath: string, names?: ReadonlyMap<number, string[]>): BankContents {
  const folder = streamedMediaFolder(bankPath, bank.languageId)
  const streamed = new Set<number>()
  const embeddedSources = new Set<number>()
  let unparsed = 0
  for (const entry of bank.hirc) {
    if (entry.type !== WwiseHircType.Sound && entry.type !== WwiseHircType.MusicTrack) {
      continue
    }
    let sources: WwiseSource[]
    try {
      sources = objectSources(parseHircObject(bank, entry))
    } catch {
      unparsed++
      continue
    }
    for (const source of sources) {
      if (source.streamType !== 0) {
        streamed.add(source.mediaId)
      } else {
        embeddedSources.add(source.mediaId)
      }
    }
  }

  const media: BankMedia[] = []
  for (const entry of bank.media.values()) {
    // the embedded copy of a streamed source is its prefetch: the full media is the loose file
    if (!streamed.has(entry.id)) {
      media.push({ id: entry.id, kind: 'embedded', size: entry.size, path: null, events: names?.get(entry.id) ?? [] })
    }
  }
  for (const id of streamed) {
    media.push({
      id,
      kind: 'streamed',
      size: 0,
      path: folder ? `${folder}/${id}.wem` : null,
      events: names?.get(id) ?? [],
    })
  }
  let external = 0
  for (const id of embeddedSources) {
    if (!bank.media.has(id)) {
      external++
    }
  }
  return { media, external, unparsed }
}

/**
 * The file name of an exported media: `<id>_<first event name>.<ext>`, or `<id>.<ext>` without a name
 */
export function mediaFileName(media: Pick<BankMedia, 'id' | 'events'>, ext: string): string {
  const event = media.events[0]?.replace(/[^\w.-]+/g, '_')
  return event ? `${media.id}_${event}.${ext}` : `${media.id}.${ext}`
}

/**
 * The action kind of `ulActionType` (high byte) that plays its target
 */
const ACTION_PLAY = 0x04

/**
 * The names of the events that can play each media: event → play actions → sounds, containers and music nodes →
 * sources, every branch (switches, random picks). Only events with a known name count.
 *
 * @param banks - the banks whose objects are walked, e.g. a bank and its `<name>_events.bnk`
 * @param eventNames - event names by event id (the short id of the name), see `atlEventNames`
 * @returns the event names by media id, in bank order
 */
export function mediaEventNames(
  banks: readonly WwiseBank[],
  eventNames: ReadonlyMap<number, string>,
): Map<number, string[]> {
  const index = new Map<number, { bank: WwiseBank; entry: WwiseBank['hirc'][number] }>()
  for (const bank of banks) {
    for (const entry of bank.hirc) {
      index.set(entry.id, { bank, entry })
    }
  }
  const parsed = new Map<number, WwiseHircObject | null>()
  const object = (id: number) => {
    if (!parsed.has(id)) {
      const it = index.get(id)
      let result: WwiseHircObject | null = null
      try {
        result = it ? parseHircObject(it.bank, it.entry) : null
      } catch {
        // a layout this parser does not read (e.g. older bank versions)
      }
      parsed.set(id, result)
    }
    return parsed.get(id)
  }
  const reach = (id: number, media: Set<number>, seen: Set<number>) => {
    if (seen.has(id)) {
      return
    }
    seen.add(id)
    const node = object(id)
    if (!node) {
      return
    }
    for (const source of objectSources(node)) {
      media.add(source.mediaId)
    }
    for (const child of objectChildren(node)) {
      reach(child, media, seen)
    }
  }

  const result = new Map<number, string[]>()
  for (const [id, { entry }] of index) {
    const name = entry.type === WwiseHircType.Event ? eventNames.get(id) : undefined
    const event = name ? object(id) : null
    if (!name || event?.type !== WwiseHircType.Event) {
      continue
    }
    const media = new Set<number>()
    for (const actionId of event.actions) {
      const action = object(actionId)
      if (action?.type === WwiseHircType.Action && action.actionType >> 8 === ACTION_PLAY && !action.isBus) {
        reach(action.targetId, media, new Set())
      }
    }
    for (const mediaId of media) {
      const list = result.get(mediaId)
      if (list) {
        list.push(name)
      } else {
        result.set(mediaId, [name])
      }
    }
  }
  return result
}

function objectChildren(object: WwiseHircObject): number[] {
  switch (object.type) {
    case WwiseHircType.RanSeqCntr:
    case WwiseHircType.SwitchCntr:
    case WwiseHircType.LayerCntr:
      return object.children
    case WwiseHircType.MusicSegment:
    case WwiseHircType.MusicSwitch:
    case WwiseHircType.MusicRanSeq:
      return object.music.children
    default:
      return []
  }
}

function objectSources(object: WwiseHircObject): WwiseSource[] {
  switch (object.type) {
    case WwiseHircType.Sound:
      return [object.source]
    case WwiseHircType.MusicTrack:
      return object.sources
    default:
      return []
  }
}
