import { Show } from 'solid-js'
import { Button, Icon, ScalarInput } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import svgSun from '../../icons/sun-bright.svg?raw'
import { createTimeOfDayButtonStore, formatTimeOfDay } from './TimeOfDayButton.store'
import './TimeOfDayButton.css'

/**
 * Shows the time of day and opens its slider. The slider stays open until the next click on the button, so the camera
 * can move meanwhile.
 */
export function TimeOfDayButton(props: { viewer: NwViewer }) {
  const store = createTimeOfDayButtonStore(props)
  return (
    <div class="nw-tod">
      <Button
        title={store.state.open ? 'Hide the time of day slider' : 'Change the time of day'}
        icon={<Icon svg={svgSun} />}
        active={store.state.open}
        onClick={store.toggle}
      >
        {formatTimeOfDay(store.state.time)}
      </Button>
      <Show when={store.state.open}>
        <div class="nw-tod-popover">
          <ScalarInput
            value={store.state.time}
            min={0}
            max={23.95}
            step={0.05}
            decimals={2}
            unit="h"
            range
            onInput={store.setTime}
            onChange={store.setTime}
          />
        </div>
      </Show>
    </div>
  )
}
