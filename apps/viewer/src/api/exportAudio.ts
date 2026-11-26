import type { ExportAction, ExportContext } from './export'

/**
 * Zip output is moved from JS memory into a Blob (which the browser may keep on disk) every this many bytes
 */
const ZIP_FLUSH_BYTES = 64 * 1024 * 1024

/**
 * The page made exports of audio files. nwbt has no audio decoder, the page decodes with
 * vgmstream (the audio preview worker):
 * - `.wem`: WAV
 * - `.bnk`: every embedded and streamed media as WAV in a zip, or as stored `.wem` in a zip
 */
export function audioExportActions(context: ExportContext, path: string): ExportAction[] {
  const name = path.split('/').pop() ?? path
  const stem = name.replace(/\.[^.]+$/, '')
  if (path.endsWith('.wem')) {
    return [
      pageAction('wav', 'export', 'WAV', 'Decoded to a 16 bit PCM WAV file', `${stem}.wav`, async (_, signal) => {
        return new Blob([(await mediaWav(() => fetchBytes(context, path, signal), signal)) as BlobPart], {
          type: 'audio/wav',
        })
      }),
    ]
  }
  return [
    pageAction(
      'wav-zip',
      'export',
      'WAV zip',
      'Every media of the bank (embedded and streamed) decoded to WAV, in one zip',
      `${stem}.wav.zip`,
      (onProgress, signal) => bankZip(context, path, 'wav', onProgress, signal),
    ),
    pageAction(
      'wem-zip',
      'download',
      'Media zip',
      'Every media of the bank (embedded and streamed) as stored .wem files, in one zip',
      `${stem}.wem.zip`,
      (onProgress, signal) => bankZip(context, path, 'wem', onProgress, signal),
    ),
  ]
}

/**
 * A media file (`.wem`) decoded to a RIFF WAVE file
 */
export async function mediaWav(load: () => Promise<Uint8Array>, signal?: AbortSignal): Promise<Uint8Array> {
  const { audioPreview } = await import('../audio/preview')
  return audioPreview.wav(load, signal)
}

function pageAction(
  id: string,
  group: ExportAction['group'],
  label: string,
  title: string,
  fileName: string,
  create: NonNullable<ExportAction['create']>,
): ExportAction {
  return { id, group, label, title, url: null, create, fileName }
}

async function fetchBytes(context: ExportContext, path: string, signal?: AbortSignal): Promise<Uint8Array> {
  const res = await fetch(context.nwbt.filesUrl(path), { signal })
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'not in the paks' : `${res.status} ${res.statusText}`)
  }
  return new Uint8Array(await res.arrayBuffer())
}

/**
 * The media of a bank in a zip, named `<media id>_<event name>.wav` (or `.wem`, `<media id>.wav` without a known
 * event, see `mediaFileName`). Media that are missing or do not decode are listed in `missing.txt` instead of failing
 * the export.
 */
async function bankZip(
  context: ExportContext,
  path: string,
  format: 'wav' | 'wem',
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const [{ Zip, ZipPassThrough }, { bankContents, mediaFileName }, { getWwiseBankMedia, parseWwiseBank }] =
    await Promise.all([import('fflate'), import('../audio/preview'), import('../audio/wwise')])
  const bank = parseWwiseBank(await fetchBytes(context, path, signal))
  const { media } = bankContents(bank, path, await context.audioNames.bankMediaNames(path, bank, signal))

  const blobs: Blob[] = []
  let pending: Uint8Array[] = []
  let pendingBytes = 0
  const flush = () => {
    blobs.push(new Blob(pending as BlobPart[]))
    pending = []
    pendingBytes = 0
  }
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      throw err
    }
    pending.push(chunk)
    pendingBytes += chunk.byteLength
    if (final || pendingBytes >= ZIP_FLUSH_BYTES) {
      flush()
    }
  })
  const add = (name: string, data: Uint8Array) => {
    // stored: WAV and Wwise media barely compress, and storing keeps the export fast
    const file = new ZipPassThrough(name)
    zip.add(file)
    file.push(data, true)
  }

  const missing: string[] = []
  for (let i = 0; i < media.length; i++) {
    signal?.throwIfAborted()
    const item = media[i]
    try {
      let wem: Uint8Array | null
      if (item.kind === 'embedded') {
        wem = getWwiseBankMedia(bank, item.id)
      } else if (item.path) {
        wem = await fetchBytes(context, item.path, signal)
      } else {
        throw new Error('the folder of the streamed media is unknown')
      }
      if (!wem) {
        throw new Error('not in the bank')
      }
      const data = format === 'wav' ? await mediaWav(async () => wem, signal) : wem
      add(mediaFileName(item, format), data)
    } catch (err) {
      if (signal?.aborted) {
        throw err
      }
      missing.push(`${item.id}\t${item.kind}\t${err instanceof Error ? err.message : String(err)}`)
    }
    onProgress?.(i + 1, media.length)
  }
  if (missing.length) {
    add('missing.txt', new TextEncoder().encode(`media id\tkind\treason\n${missing.join('\n')}\n`))
  }
  zip.end()
  return new Blob(blobs, { type: 'application/zip' })
}
