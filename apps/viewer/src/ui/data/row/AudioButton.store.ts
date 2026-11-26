import { createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { audioPreview } from '../../../audio/preview'
import { useApp } from '../../app/ViewerApp'
import type { TriggerMedia } from '../audio'

export interface AudioButtonState {
  /**
   * Why the last play failed, null when it did not
   */
  error: string | null
  /**
   * Counts the changes of the audio preview: what plays is read again
   */
  changes: number
}

export type AudioButtonStore = ReturnType<typeof createAudioButtonStore>

/**
 * The state and actions of an audio trigger: the media it can play (looked up with the first play), which one plays,
 * the next one to play
 */
export function createAudioButtonStore(props: { trigger: string }) {
  const app = useApp()
  const [state, setState] = createStore<AudioButtonState>({ error: null, changes: 0 })
  onCleanup(audioPreview.onChange(() => setState('changes', (it) => it + 1)))
  // the media of the trigger: not part of the state, they hold their loaders
  const [media, setMedia] = createSignal<TriggerMedia[] | null>(null)
  let next = 0

  const keyOf = (it: TriggerMedia) => `data:${props.trigger}#${it.id}`
  const playing = () => {
    void state.changes
    const key = audioPreview.playback?.key
    return !!key && !!media()?.some((it) => keyOf(it) === key)
  }

  return {
    state,
    playing,
    /**
     * The number of media the trigger can play, null until looked up
     */
    mediaCount: () => media()?.length ?? null,
    title: () => audioTitle(state.error, media()?.length ?? null),
    /**
     * Plays the next media of the trigger, or stops it while it plays
     */
    async toggle() {
      if (playing()) {
        audioPreview.stop()
        return
      }
      try {
        const list = media() ?? (await app.triggerAudio.triggerMedia(props.trigger))
        setMedia(list)
        if (!list.length) {
          setState('error', 'No media found for this trigger')
          return
        }
        const it = list[next++ % list.length]
        setState('error', null)
        await audioPreview.play(keyOf(it), it.load)
        const failed = audioPreview.errors.get(keyOf(it))
        if (failed) {
          setState('error', failed)
        }
      } catch (err) {
        setState('error', String(err instanceof Error ? err.message : err))
      }
    },
  }
}

/**
 * The title of the play button: the error, else how many media the trigger plays
 */
export function audioTitle(error: string | null, count: number | null): string {
  if (error) {
    return error
  }
  if (count != null && count > 1) {
    return `Play (${count} media, each click plays the next)`
  }
  return 'Play'
}
