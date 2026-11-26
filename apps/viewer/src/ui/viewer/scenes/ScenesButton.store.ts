import { createStore } from 'solid-js/store'
import type { LevelEntry } from '../../../levels/catalog'
import type { NwViewer } from '../../../viewer'
import { useApp } from '../../app/ViewerApp'
import type { ScenesButtonState } from './types'

export type ScenesButtonStore = ReturnType<typeof createScenesButtonStore>

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
  }
}
