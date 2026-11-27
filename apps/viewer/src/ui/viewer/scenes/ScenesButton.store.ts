import { createStore } from 'solid-js/store'
import type { LevelEntry } from '../../../levels/catalog'
import type { NwViewer } from '../../../viewer'
import { useApp } from '../../app/ViewerApp'
import type { ScenesButtonState } from './types'

export type ScenesButtonStore = ReturnType<typeof createScenesButtonStore>

/**
 * Random dungeon seeds are below this, short enough to read in the url
 */
const MAX_SEED = 1_000_000

/**
 * The scenes dialog: opens on a click, a selected scene replaces the content of the viewer
 */
export function createScenesButtonStore(props: { viewer: NwViewer }) {
  const app = useApp()
  const [state, setState] = createStore<ScenesButtonState>({ open: false })
  return {
    state,
    open() {
      setState('open', true)
    },
    close() {
      setState('open', false)
    },
    select(entry: LevelEntry) {
      setState('open', false)
      app.viewerContent.showSceneEntry(props.viewer, entry)
    },
    /**
     * Opens a dungeon level (the catacombs) with a new random dungeon
     */
    selectNewSeed(entry: LevelEntry) {
      setState('open', false)
      const seed = 1 + Math.floor(Math.random() * MAX_SEED)
      app.viewerContent.showSceneEntry(props.viewer, entry, { seed: String(seed) })
    },
  }
}
