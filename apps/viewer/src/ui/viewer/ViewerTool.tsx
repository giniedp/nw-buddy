import { Show } from 'solid-js'
import { EngineSurface } from '../app/surface/EngineSurface'
import { ViewerOverlay } from './overlay/ViewerOverlay'
import { createViewerToolStore } from './ViewerTool.store'

/**
 * The viewer tool: the engine canvas fills the page, the overlay sits above it.
 * The url selects what is shown (`level` with an optional `mission`, `model`, `material`; without them the default
 * scene, see ./content.ts) and holds the camera position (`x`, `y`, `z`, `w`), which is kept up to date while the
 * tool is shown.
 */
export default function ViewerTool() {
  const store = createViewerToolStore()
  return (
    <EngineSurface class="nw-tool" onEngine={store.onEngine} onRunning={store.onRunning} onDetach={store.onDetach}>
      <Show when={store.viewer()}>{(it) => <ViewerOverlay viewer={it()} />}</Show>
    </EngineSurface>
  )
}
