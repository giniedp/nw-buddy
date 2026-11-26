/// <reference lib="webworker" />
import { VgmstreamDecoder } from '../engine/decoder'
import { publicAssetUrl } from '../../content/publicAssets'
import type { PreviewRequest, PreviewResponse } from './protocol'

/**
 * Decodes media for the audio preview of the browser with vgmstream. Requests run one after the other (the decode is
 * synchronous). Only the decoder: the audio engine of the viewer is not loaded here.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope
let decoder: Promise<VgmstreamDecoder> | null = null

const post = (message: PreviewResponse, transfer: Transferable[] = []) => scope.postMessage(message, transfer)

scope.addEventListener('message', async (event: MessageEvent<PreviewRequest>) => {
  const { id, kind, bytes } = event.data
  try {
    decoder ??= VgmstreamDecoder.load(publicAssetUrl('vendor/vgmstream/')).catch((err) => {
      decoder = null
      throw err
    })
    const vgmstream = await decoder
    if (kind === 'wav') {
      const wav = vgmstream.decodeWav(bytes)
      post({ id, kind, wav }, [wav.buffer])
    } else {
      const { sampleRate, channels } = vgmstream.decode(bytes)
      post(
        { id, kind, sampleRate, channels },
        channels.map((it) => it.buffer),
      )
    }
  } catch (err) {
    post({ id, kind: 'error', message: String(err instanceof Error ? err.message : err) })
  }
})
