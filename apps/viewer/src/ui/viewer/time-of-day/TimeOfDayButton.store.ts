import { createStore } from 'solid-js/store'
import { track } from 'tweak-ui'
import { SkyLightSystem } from '../../../game/level/SkyLightSystem'
import type { NwViewer } from '../../../viewer'
import { createUiPanel } from '../PanelScope'
import type { TimeOfDayButtonState } from './types'

/**
 * How often the time is sampled, in milliseconds
 */
const SAMPLE_INTERVAL = 500

export type TimeOfDayButtonStore = ReturnType<typeof createTimeOfDayButtonStore>

/**
 * The time of day of the viewer and its slider
 */
export function createTimeOfDayButtonStore(props: { viewer: NwViewer }) {
  const panel = createUiPanel()
  const timeOfDay = () => props.viewer.world.getSystem(SkyLightSystem).timeOfDay
  // a level sets its own time, and it advances on its own while animated
  const time = track(() => panel.pull(() => timeOfDay().time), { interval: SAMPLE_INTERVAL })

  const [state, setState] = createStore<TimeOfDayButtonState>({
    open: false,
    get time() {
      return time()
    },
  })

  return {
    state,
    toggle() {
      setState('open', !state.open)
    },
    setTime(value: number) {
      timeOfDay().time = value
      panel.redraw()
    },
  }
}

/**
 * An hour of the day with fraction as a clock time, e.g. `06:30`
 */
export function formatTimeOfDay(time: number): string {
  // tolerates the float error of a fraction, e.g. 8.1 hours are 485.99… minutes
  const minutes = Math.floor(time * 60 + 1e-3)
  const hour = Math.floor(minutes / 60) % 24
  return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
