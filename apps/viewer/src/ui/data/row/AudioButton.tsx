import { Show, type JSX } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import svgPlay from '../../icons/play.svg?raw'
import svgStop from '../../icons/stop.svg?raw'
import { createAudioButtonStore } from './AudioButton.store'

/**
 * An audio trigger of a cell with a play button. Each click plays the next media the trigger can play (random
 * containers have several), a click while playing stops.
 *
 * @param label - shown instead of the trigger name, e.g. the cell value the trigger is made from
 */
export function AudioButton(props: { trigger: string; label?: JSX.Element }) {
  const store = createAudioButtonStore(props)
  const { state } = store

  return (
    <span class="nw-data-audio">
      <Button
        ghost
        square
        title={store.title()}
        classList={{ 'nw-error': !!state.error }}
        icon={<Icon svg={store.playing() ? svgStop : svgPlay} />}
        onClick={() => void store.toggle()}
      />
      <span class="nw-data-text" classList={{ 'nw-data-dead': store.mediaCount() === 0 }} title={props.trigger}>
        {props.label ?? props.trigger}
      </span>
      <Show when={(store.mediaCount() ?? 0) > 1}>
        <span class="nw-muted">×{store.mediaCount()}</span>
      </Show>
    </span>
  )
}
