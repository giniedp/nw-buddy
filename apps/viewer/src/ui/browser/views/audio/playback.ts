import { createEffect, onCleanup, type Accessor } from 'solid-js'
import { createStore } from 'solid-js/store'
import { audioPreview, type MediaLoader } from '../../../../audio/preview'
import type { PlaybackState } from './types'

/**
 * How often the position of the playing clip is shown again
 */
const POSITION_POLL_MS = 100

export type Playback = ReturnType<typeof createPlayback>

/**
 * The playback of the audio preview as store state, for the stores of the audio views. Stops the preview when the view
 * is hidden (another mode or tab) and when it closes.
 */
export function createPlayback(shown: Accessor<boolean>) {
  const [state, setState] = createStore<PlaybackState>({
    changes: 0,
    key: null,
    name: '',
    duration: 0,
    channels: 0,
    position: 0,
  })
  const syncState = () => {
    const playing = audioPreview.playback
    setState({
      changes: state.changes + 1,
      key: playing?.key ?? null,
      name: playing?.key.split(/[/#]/).pop() ?? '',
      duration: playing?.duration ?? 0,
      channels: playing?.channels ?? 0,
    })
  }
  syncState()
  onCleanup(audioPreview.onChange(syncState))
  const timer = setInterval(() => setState('position', audioPreview.position()), POSITION_POLL_MS)
  onCleanup(() => clearInterval(timer))

  createEffect(() => {
    if (!shown()) {
      audioPreview.stop()
    }
  })
  onCleanup(() => audioPreview.stop())

  return {
    state,
    isPlaying(key: string) {
      return state.key === key
    },
    /**
     * The last decode error of a clip
     */
    errorOf(key: string) {
      return audioPreview.errors.get(key) ?? null
    },
    /**
     * Plays the clip, or stops it when it plays
     */
    toggle(key: string, load: MediaLoader) {
      if (audioPreview.playback?.key === key) {
        audioPreview.stop()
      } else {
        audioPreview.play(key, load)
      }
    },
    stop() {
      audioPreview.stop()
    },
  }
}

/**
 * Seconds as `m:ss.s`
 */
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, '0')}`
}
