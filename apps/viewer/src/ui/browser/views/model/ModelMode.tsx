import { For, Show } from 'solid-js'
import { Button, ButtonGroup } from 'tweak-ui'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import type { AssetViewProps } from '../registry'
import { createModelModeStore } from './ModelMode.store'

/**
 * A `.cgf` or `.skin` shown by the engine: the model with the orbit camera (drag to turn, wheel to zoom), the sky and
 * the grid of the viewer's model mode. The file is parsed in the frontend (formats/cgf), like the level does.
 *
 * @remarks
 * The engine shows one content at a time (D5): showing a model unloads the level, the viewer opens it again. Showing
 * the same model again (e.g. after the Details mode) keeps it and the camera.
 */
export default function ModelMode(props: AssetViewProps) {
  const store = createModelModeStore(props)
  const { state } = store

  return (
    <div class="nw-model">
      <div class="nw-view-bar">
        <Show when={state.maxLevel > 0}>
          <span class="nw-view-label">LOD</span>
          <ButtonGroup>
            <Button
              ghost
              active={state.forced == null}
              title="By the distance to the camera"
              onClick={() => store.force(null)}
            >
              Auto
            </Button>
            <For each={state.levels}>
              {(level) => (
                <Button
                  ghost
                  active={state.forced === level}
                  title={`Level of detail ${level}`}
                  onClick={() => store.force(level)}
                >
                  {String(level)}
                </Button>
              )}
            </For>
          </ButtonGroup>
        </Show>
        <Button ghost title="Point the camera at the model again" onClick={store.resetCamera}>
          Reset camera
        </Button>
        <span class="nw-view-info nw-push-end">{state.info}</span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={store.attach} onDetach={store.detach} />
    </div>
  )
}
