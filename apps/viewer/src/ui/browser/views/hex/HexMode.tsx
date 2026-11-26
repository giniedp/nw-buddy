import { Match, Switch } from 'solid-js'
import { HexView } from '../../../common/hex/HexView'
import type { AssetViewProps } from '../registry'
import { createHexModeStore } from './HexMode.store'

/**
 * The raw bytes of the file. Loaded when the mode is first shown. Marks the range of `ViewerApp.tabs.showBytes`.
 */
export function HexMode(props: AssetViewProps) {
  const store = createHexModeStore(props)
  const { state } = store
  return (
    <Switch fallback={<p class="nw-note">Reading…</p>}>
      <Match when={state.loadError}>
        <p class="nw-note">The file could not be read: {state.loadError}</p>
      </Match>
      <Match when={state.ready}>
        <HexView bytes={store.bytes()} highlight={store.mark()} tools={<span class="nw-muted">{state.size}</span>} />
      </Match>
    </Switch>
  )
}
