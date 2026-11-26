import { Button } from 'tweak-ui'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import type { AssetViewProps } from '../registry'
import { createSliceModeStore } from './SliceMode.store'

/**
 * A `.dynamicslice` shown by the engine: the slice and every slice it spawns, at the origin, with the sky, the grid
 * and the orbit camera. The slices come converted from nwbt (`/browse/slice`, user decision), the engine spawns them
 * like the slices of a level. Only offered for slices with models. The engine shows one content at a time (D5).
 */
export default function SliceMode(props: AssetViewProps) {
  const store = createSliceModeStore(props)
  const { state } = store

  return (
    <div class="nw-model" onPointerDown={store.touch} onWheel={store.touch}>
      <div class="nw-view-bar">
        <Button ghost title="Point the camera at the models of the slice" onClick={store.frame}>
          Frame
        </Button>
        <span class="nw-view-info nw-push-end">{state.info}</span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={store.attach} onDetach={store.detach} />
    </div>
  )
}
