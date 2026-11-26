/**
 * A decode request to the preview worker: `pcm` gives planar float channels (to play), `wav` the RIFF WAVE file (to
 * export)
 */
export interface PreviewRequest {
  id: number
  kind: 'pcm' | 'wav'
  bytes: Uint8Array
}

export type PreviewResponse =
  | { id: number; kind: 'pcm'; sampleRate: number; channels: Float32Array[] }
  | { id: number; kind: 'wav'; wav: Uint8Array }
  | { id: number; kind: 'error'; message: string }
