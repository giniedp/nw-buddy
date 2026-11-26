import { For, Show } from 'solid-js'
import { Button, ButtonGroup } from 'tweak-ui'
import { EngineSurface } from '../../../app/surface/EngineSurface'
import type { AssetViewProps } from '../registry'
import { createMaterialModeStore } from './MaterialMode.store'

/**
 * A `.mtl` shown by the engine: every sub material on a shader ball, on a ground plate under the sky, with the orbit
 * camera. The toolbar frames one ball or all of them. The engine shows one content at a time (D5).
 */
export default function MaterialMode(props: AssetViewProps) {
  const store = createMaterialModeStore(props)
  const { state } = store

  return (
    <div class="nw-model">
      <div class="nw-view-bar">
        <Show when={state.names.length > 1}>
          <ButtonGroup>
            <Button ghost active={state.focus == null} title="Frame all shader balls" onClick={() => store.frame(null)}>
              All
            </Button>
            <For each={state.names}>
              {(name, i) => (
                <Button
                  ghost
                  active={state.focus === i()}
                  title={`Frame the ball of ${name}`}
                  onClick={() => store.frame(i())}
                >
                  {name || `#${i()}`}
                </Button>
              )}
            </For>
          </ButtonGroup>
        </Show>
        <Show when={state.names.length === 1}>
          <Button ghost title="Frame the shader ball" onClick={() => store.frame(null)}>
            Frame
          </Button>
        </Show>
        <span class="nw-view-info nw-push-end">{state.info}</span>
      </div>
      <EngineSurface class="nw-model-surface" active={props.shown} onRunning={store.attach} onDetach={store.detach} />
    </div>
  )
}
