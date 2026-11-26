import { Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { nodeViewOf } from './registry'

/**
 * The properties of an engine object, rendered by the props component of its view (see `NODE_VIEWS`).
 * Renders nothing without an object or without a props component. Another object renders the component anew, so
 * the props components get an object that does not change.
 */
export function NodeProps(props: { data: object | null | undefined }) {
  return (
    <Show when={props.data} keyed>
      {(data) => {
        const component = nodeViewOf(data)?.props
        return <Show when={component}>{(it) => <Dynamic component={it()} data={data} />}</Show>
      }}
    </Show>
  )
}
