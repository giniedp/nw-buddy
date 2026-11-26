import type { NwbtClient } from '../../api/browse'
import { parseAtlControls, parseWwiseBank, wwiseShortId, type WwiseBank } from '../wwise'
import { mediaEventNames } from './media'

/**
 * The ATL controls of the game: every trigger names its Wwise events
 */
const ATL_CONTROLS = 'libs/gameaudio/wwise/atl_controls.xml'

/**
 * The event names of the audio of one nwbt server
 */
export class AudioNames {
  private readonly nwbt: NwbtClient
  private eventNames: Promise<Map<number, string>> | null = null

  public constructor(nwbt: NwbtClient) {
    this.nwbt = nwbt
  }

  /**
   * The Wwise event names of the ATL triggers by event id (the short id of the name), loaded once. Empty when the
   * controls do not load: the names are a convenience.
   */
  public atlEventNames(): Promise<Map<number, string>> {
    this.eventNames ??= fetch(this.nwbt.filesUrl(ATL_CONTROLS))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.status}`)
        }
        return res.text()
      })
      .then((xml) => {
        const result = new Map<number, string>()
        for (const trigger of parseAtlControls(xml).triggers.values()) {
          for (const event of trigger.events) {
            result.set(wwiseShortId(event), event)
          }
        }
        return result
      })
      .catch((err) => {
        console.warn('audio event names not loaded:', String(err))
        this.eventNames = null
        return new Map<number, string>()
      })
    return this.eventNames
  }

  /**
   * The event names of the media of a bank, see {@link mediaEventNames}. The events of a bank are often in a sibling
   * `<name>_events.bnk` (e.g. `ambiences_events.bnk`), it is walked with the bank when it exists. Media only banks
   * (e.g. the biome wildlife banks) get no names: the banks that play them are not known from the bank.
   */
  public async bankMediaNames(path: string, bank: WwiseBank, signal?: AbortSignal): Promise<Map<number, string[]>> {
    const [names, sibling] = await Promise.all([
      this.atlEventNames(),
      this.loadBank(path.replace(/.bnk$/i, '_events.bnk'), signal),
    ])
    return mediaEventNames(sibling ? [bank, sibling] : [bank], names)
  }

  private async loadBank(path: string, signal?: AbortSignal): Promise<WwiseBank | null> {
    try {
      const res = await fetch(this.nwbt.filesUrl(path), { signal })
      return res.ok ? parseWwiseBank(new Uint8Array(await res.arrayBuffer())) : null
    } catch {
      return null
    }
  }
}
