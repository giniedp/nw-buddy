/**
 * Audio of the Data tool: an audio trigger name of a cell (`Play_Imp_SwordMetal_Metal`) resolved to the media it can
 * play. ATL trigger → Wwise events → banks (trigger bank map) → the event's media in those banks. Only the media are
 * played, one at a time, without switches, RTPCs or 3D (not the event player, browser-features B5).
 */
import type { NwbtClient } from '../../api/browse'
import { loadAudioCatalog, type AudioCatalog } from '../../audio/engine/catalog'
import type { MediaLoader } from '../../audio/preview/AudioPreview'
import { bankContents, mediaEventNames } from '../../audio/preview/media'
import { getWwiseBankMedia, parseWwiseBank, wwiseShortId, type WwiseBank } from '../../audio/wwise'
import type { FileContents } from '../../api/files'

/**
 * The folder of the banks, as the audio engine loads them
 */
const BANK_FOLDER = 'sounds/wwise'

/**
 * One media an audio trigger can play
 */
export interface TriggerMedia {
  id: number
  event: string
  load: MediaLoader
}

/**
 * The audio triggers of the data and the media they play, of one nwbt server
 */
export class TriggerAudio {
  private readonly nwbt: NwbtClient
  private readonly files: FileContents
  private catalog: Promise<AudioCatalog> | null = null
  private readonly banks = new Map<string, Promise<WwiseBank | null>>()
  private readonly resolved = new Map<string, Promise<TriggerMedia[]>>()

  public constructor(nwbt: NwbtClient, files: FileContents) {
    this.nwbt = nwbt
    this.files = files
  }

  /**
   * The media an audio trigger can play, empty when none is found
   */
  public triggerMedia(trigger: string): Promise<TriggerMedia[]> {
    const id = trigger.toLowerCase()
    let result = this.resolved.get(id)
    if (!result) {
      result = this.resolve(trigger)
      result.catch(() => this.resolved.delete(id))
      this.resolved.set(id, result)
    }
    return result
  }

  private audioCatalog() {
    if (!this.catalog) {
      this.catalog = loadAudioCatalog(this.nwbt.baseUrl)
      this.catalog.catch(() => (this.catalog = null))
    }
    return this.catalog
  }

  private loadBank(name: string): Promise<WwiseBank | null> {
    let bank = this.banks.get(name)
    if (!bank) {
      bank = fetch(this.nwbt.filesUrl(`${BANK_FOLDER}/${name}`))
        .then(async (res) => (res.ok ? parseWwiseBank(new Uint8Array(await res.arrayBuffer())) : null))
        .catch(() => null)
      this.banks.set(name, bank)
    }
    return bank
  }

  private async resolve(trigger: string): Promise<TriggerMedia[]> {
    const audio = await this.audioCatalog()
    const atl = audio.atl.triggers.get(trigger.toLowerCase())
    const events = atl?.events.length ? atl.events : [trigger]
    const bankNames = new Set<string>()
    for (const name of [trigger, ...events]) {
      for (const bank of audio.triggerBanks.banksForEvent(name)) {
        bankNames.add(bank)
      }
    }
    const loaded: Array<{ name: string; bank: WwiseBank }> = []
    for (const name of bankNames) {
      const bank = await this.loadBank(name)
      if (bank) {
        loaded.push({ name, bank })
      }
    }
    const names = new Map(events.map((event) => [wwiseShortId(event), event]))
    const byMedia = mediaEventNames(
      loaded.map((it) => it.bank),
      names,
    )
    // where a media is: embedded in one of the banks, or a loose `.wem` that a bank streams
    const loaders = new Map<number, MediaLoader>()
    for (const { name, bank } of loaded) {
      for (const media of bankContents(bank, `${BANK_FOLDER}/${name}`).media) {
        if (loaders.has(media.id) || !byMedia.has(media.id)) {
          continue
        }
        if (media.kind === 'embedded') {
          loaders.set(media.id, async () => getWwiseBankMedia(bank, media.id) ?? new Uint8Array())
        } else if (media.path) {
          const path = media.path
          loaders.set(media.id, (signal) => this.files.fileBytes(path, signal))
        }
      }
    }
    const result: TriggerMedia[] = []
    for (const [mediaId, mediaEvents] of byMedia) {
      const load = loaders.get(mediaId)
      if (load) {
        result.push({ id: mediaId, event: mediaEvents[0], load })
      }
    }
    return result
  }
}
