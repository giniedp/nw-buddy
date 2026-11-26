import { createStore } from 'solid-js/store'
import { track } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { configValue } from '../../common/reactive'
import type { ViewerOverlayState } from './types'

export type ViewerOverlayStore = ReturnType<typeof createViewerOverlayStore>

/**
 * The toolbar of the viewer tool and its two sidebars: audio, the game clock, the screenshot
 */
export function createViewerOverlayStore(props: { viewer: NwViewer }) {
  const audio = configValue(props.viewer.config, 'audioEnabled')
  // scripts and ?clock= change the clock as well, so it is polled
  const clockFrozen = track(() => isFrozen(props.viewer), { interval: 500 })

  const [state, setState] = createStore<ViewerOverlayState>({
    left: false,
    right: false,
    get audio() {
      return audio()
    },
    get clockFrozen() {
      return clockFrozen()
    },
    get clockTime() {
      // read again when the clock freezes or runs
      clockFrozen()
      return props.viewer.clock.game.total.toFixed(2)
    },
  })

  return {
    state,
    toggleLeft() {
      setState('left', !state.left)
    },
    toggleRight() {
      setState('right', !state.right)
    },
    /**
     * Call it in the click: the audio context starts in a user gesture only (autoplay policy)
     */
    toggleAudio() {
      props.viewer.config.set('audioEnabled', !state.audio)
    },
    /**
     * Pauses the game clock at its current time, or lets a paused or fixed clock run again
     */
    toggleClock() {
      const clock = props.viewer.clock
      if (isFrozen(props.viewer)) {
        clock.setFixed(null)
        clock.resume()
      } else {
        clock.pause()
      }
    },
    screenshot() {
      props.viewer.downloadScreenshot()
    },
  }
}

function isFrozen(viewer: NwViewer) {
  return viewer.clock.game.paused || viewer.clock.game.fixed != null
}
