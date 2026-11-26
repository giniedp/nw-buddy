import type { Device, GpuTimer } from '@gglib/graphics'
import type { RenderPass } from '@gglib/render'
import { createStore } from 'solid-js/store'
import { usePanel } from '../PanelScope'
import type { PassTimerState } from './types'

/**
 * Timers are kept per pass, so toggling a timer does not consume new device timer slots
 */
const passTimers = new WeakMap<RenderPass, GpuTimer>()

export type PassTimerStore = ReturnType<typeof createPassTimerStore>

/**
 * The GPU timer of a pass: turned on and off, and its times
 */
export function createPassTimerStore(props: { pass: RenderPass; device: Device }) {
  const panel = usePanel()
  const [state] = createStore<PassTimerState>({
    get enabled() {
      return panel.pull(() => !!props.pass.gpuTimer)
    },
  })

  return {
    state,
    /**
     * The times of the timer in milliseconds. The engine changes them on each frame, read them in a `PollWidget`.
     */
    times() {
      return formatTimes(props.pass.gpuTimer)
    },
    setEnabled(enabled: boolean) {
      const pass = props.pass
      if (!enabled) {
        pass.gpuTimer = null
      } else {
        if (!passTimers.has(pass)) {
          passTimers.set(pass, props.device.createGpuTimer({ name: pass.name }))
        }
        pass.gpuTimer = passTimers.get(pass)
        pass.gpuTimer.reset()
      }
      panel.redraw()
    },
  }
}

/**
 * The last, average and max time of a timer in milliseconds, empty without a timer
 */
export function formatTimes(timer: Pick<GpuTimer, 'time' | 'average' | 'max'> | null | undefined): string {
  if (!timer) {
    return ''
  }
  const ms = (value: number) => value.toFixed(2)
  return `${ms(timer.time)} avg ${ms(timer.average)} max ${ms(timer.max)}`
}
