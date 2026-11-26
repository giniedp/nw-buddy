import { For } from 'solid-js'
import { PollWidget } from 'tweak-ui'
import { DebugLayer, type DebugShapeComponent } from '../../../game/debug/DebugShapeComponent'
import { usePanel } from '../PanelScope'

/**
 * The shapes and the info values of the component. The engine changes the info values without telling, so they are
 * polled.
 */
export function DebugShapeComponentProps(props: { data: DebugShapeComponent }) {
  const panel = usePanel()
  return (
    <>
      <For each={panel.pull(() => [...props.data.entries])}>
        {(entry, i) => (
          <PollWidget
            label={`shape ${i()}`}
            value={`${entry.type} ${layerNames(entry.layer)} (${entry.transforms?.length ?? 0})`}
          />
        )}
      </For>
      <For each={panel.pull(() => [...props.data.info])}>
        {(info) => <PollWidget label={info.label} value={info.get() ?? '-'} />}
      </For>
    </>
  )
}

/**
 * The names of the layers in the mask, `-` for none
 */
function layerNames(layer: DebugLayer) {
  const names = Object.entries(DebugLayer)
    .filter(([, value]) => (layer & value) !== 0)
    .map(([name]) => name)
  return names.join(' | ') || '-'
}
