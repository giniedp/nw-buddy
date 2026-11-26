import type { GridApi } from 'ag-grid-community'
import { createEffect, createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { saveBlob } from '../../../../api/export'
import { mediaWav } from '../../../../api/exportAudio'
import { bankContents, mediaFileName, type BankMedia, type MediaLoader } from '../../../../audio/preview'
import { getWwiseBankMedia, parseWwiseBank, wwiseShortId, type WwiseBank } from '../../../../audio/wwise'
import type { AssetViewProps } from '../registry'
import { createPlayback } from './playback'
import type { AudioBankModeState, LoadedBank } from './types'

export type AudioBankModeStore = ReturnType<typeof createAudioBankModeStore>

/**
 * The state and actions of the bank mode: reads the `.bnk` of the tab with the names of its media, plays and saves the
 * media
 */
export function createAudioBankModeStore(props: AssetViewProps) {
  const shown = createMemo(() => props.shown)
  const playback = createPlayback(shown)
  const [bank] = createResource(
    () => props.ctx.path,
    async (path): Promise<LoadedBank> => {
      const parsed = parseWwiseBank(await props.ctx.app.files.contentBytes(path))
      // the names of the events that play the media, some stay unnamed (media only banks)
      const names = await props.ctx.app.audioNames.bankMediaNames(path, parsed)
      return { bank: parsed, contents: bankContents(parsed, path, names) }
    },
  )
  // reading a failed resource throws: guard every read
  const loaded = createMemo(() => (bank.error ? undefined : bank()))
  const info = createMemo(() => {
    const it = loaded()
    return it ? describeBank(it, props.ctx.path) : ''
  })

  const [state] = createStore<AudioBankModeState>({
    get loadError() {
      return bank.error ? String(bank.error) : null
    },
    get ready() {
      return !!loaded()
    },
    get empty() {
      return !loaded()?.contents.media.length
    },
    get info() {
      return info()
    },
  })

  let grid: GridApi<BankMedia> | undefined
  const durations = new Map<string, number>()

  const keyOf = (media: BankMedia) => media.path ?? `${props.ctx.path}#${media.id}`
  const loaderOf = (wwise: WwiseBank, media: BankMedia): MediaLoader => {
    if (media.kind === 'embedded') {
      return async () => getWwiseBankMedia(wwise, media.id) ?? new Uint8Array()
    }
    return async (signal) => {
      if (!media.path) {
        throw new Error('the folder of the streamed media is unknown')
      }
      return props.ctx.app.files.fileBytes(media.path, signal).catch(() => {
        throw new Error('not in the paks')
      })
    }
  }

  // durations and the play buttons follow the playback
  createEffect(() => {
    // every change, also a decode error while nothing plays
    playback.state.changes
    if (playback.state.key) {
      durations.set(playback.state.key, playback.state.duration)
    }
    grid?.refreshCells({ columns: ['play', 'duration'], force: true })
  })

  return {
    state,
    playback,
    /**
     * The media of the bank, the rows of the grid. Not part of the state: ag-grid gets the plain objects.
     */
    rows: () => loaded()?.contents.media ?? [],
    setGrid(api: GridApi<BankMedia>) {
      grid = api
    },
    filter(text: string) {
      grid?.setGridOption('quickFilterText', text)
    },
    isPlaying(media: BankMedia) {
      return playback.isPlaying(keyOf(media))
    },
    errorOf(media: BankMedia) {
      return playback.errorOf(keyOf(media))
    },
    /**
     * Seconds of the media, known once it played
     */
    durationOf(media: BankMedia) {
      return durations.get(keyOf(media)) ?? null
    },
    toggle(media: BankMedia) {
      const wwise = loaded()?.bank
      if (wwise) {
        playback.toggle(keyOf(media), loaderOf(wwise, media))
      }
    },
    /**
     * Downloads the media, returns the error message when it failed
     */
    async save(media: BankMedia, format: 'wav' | 'wem'): Promise<string | null> {
      const wwise = loaded()?.bank
      if (!wwise) {
        return 'the bank is not read'
      }
      const stem = (props.ctx.path.split('/').pop() ?? '').replace(/\.bnk$/i, '')
      try {
        const wem = await loaderOf(wwise, media)()
        const data = format === 'wav' ? await mediaWav(async () => wem) : wem
        const type = format === 'wav' ? 'audio/wav' : 'application/octet-stream'
        saveBlob(new Blob([data as BlobPart], { type }), `${stem}_${mediaFileName(media, format)}`)
        return null
      } catch (err) {
        return String(err instanceof Error ? err.message : err)
      }
    },
  }
}

/**
 * The facts of a bank as one line: id, version, language and its media
 */
export function describeBank({ bank, contents }: LoadedBank, path: string) {
  const embedded = contents.media.filter((it) => it.kind === 'embedded').length
  const named = contents.media.filter((it) => it.events.length).length
  let text =
    `bank ${bank.id} · v${bank.version} · ${languageName(bank.languageId, path)} · ` +
    `${embedded} embedded, ${contents.media.length - embedded} streamed, ${named} named`
  if (contents.external) {
    text += ` · ${contents.external} in other banks`
  }
  if (contents.unparsed) {
    text += ` · ${contents.unparsed} objects not readable (v${bank.version})`
  }
  return text
}

/**
 * The name of a bank's language: SFX, or the bank's folder when it is the language (see `streamedMediaFolder`)
 */
export function languageName(languageId: number, bankPath: string) {
  if (languageId === wwiseShortId('SFX')) {
    return 'SFX'
  }
  const folder = bankPath.split('/').at(-2) ?? ''
  return wwiseShortId(folder) === languageId ? folder : `language ${languageId}`
}
