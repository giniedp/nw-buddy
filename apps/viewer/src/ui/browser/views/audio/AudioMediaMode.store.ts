import { createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { audioPreview, type MediaLoader } from '../../../../audio/preview'
import type { AssetViewProps } from '../registry'
import { createPlayback, formatDuration } from './playback'
import type { AudioMediaModeState } from './types'

export type AudioMediaModeStore = ReturnType<typeof createAudioMediaModeStore>

/**
 * The state and actions of the media mode: decodes the `.wem` of the tab (vgmstream) and plays it
 */
export function createAudioMediaModeStore(props: AssetViewProps) {
  const shown = createMemo(() => props.shown)
  const playback = createPlayback(shown)
  const key = () => props.ctx.path
  const load: MediaLoader = () => props.ctx.app.files.contentBytes(props.ctx.path)
  const [decoded] = createResource(key, (it) => audioPreview.clip(it, load))
  // reading a failed resource throws: guard every read
  const clip = createMemo(() => (decoded.error ? undefined : decoded()))
  const playing = createMemo(() => playback.isPlaying(key()))

  const [state] = createStore<AudioMediaModeState>({
    get ready() {
      return !!clip()
    },
    get playing() {
      return playing()
    },
    get progress() {
      return progress()
    },
    get info() {
      return info()
    },
  })
  const progress = createMemo(() => {
    const buffer = clip()
    return buffer && playing() ? playback.state.position / buffer.duration : null
  })
  const info = createMemo(() => {
    const buffer = clip()
    if (decoded.error) {
      return `Could not be decoded: ${String(decoded.error)}`
    }
    if (!buffer) {
      return 'Decoding…'
    }
    const position = playing() ? playback.state.position : 0
    return mediaInfo(position, buffer)
  })

  return {
    state,
    /**
     * The decoded clip, for the waveform. Not part of the state: the store keeps objects of other owners out.
     */
    clip,
    toggle() {
      playback.toggle(key(), load)
    },
  }
}

export function mediaInfo(position: number, buffer: Pick<AudioBuffer, 'duration' | 'numberOfChannels' | 'sampleRate'>) {
  return (
    `${formatDuration(position)} / ${formatDuration(buffer.duration)} · ` +
    `${buffer.numberOfChannels} ch · ${buffer.sampleRate} Hz`
  )
}
