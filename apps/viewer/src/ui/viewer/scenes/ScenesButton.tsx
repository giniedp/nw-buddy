import { Show } from 'solid-js'
import { Button } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import { ModalDialog } from '../../common/ModalDialog'
import { createScenesButtonStore } from './ScenesButton.store'
import { SceneList } from './SceneList'

/**
 * Opens the scene selection: the levels and game mode maps of the level catalog (levels/catalog.ts), grouped like
 * the game modes of nw-buddy. It opens on a click only.
 */
export function ScenesButton(props: { viewer: NwViewer }) {
  const store = createScenesButtonStore(props)
  return (
    <>
      <Button title="Open a level, a mission or a showcase" onClick={store.open}>
        Levels
      </Button>
      <ModalDialog title="Levels" open={store.state.open} onClose={store.close}>
        <Show when={store.state.open}>
          <SceneList onSelect={store.select} />
        </Show>
      </ModalDialog>
    </>
  )
}
