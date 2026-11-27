import { createStore } from 'solid-js/store'
import { createInterval } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import type { StatsBarState } from './types'

/**
 * How often the stats are sampled, in milliseconds
 */
const SAMPLE_INTERVAL = 500

export type StatsBarStore = ReturnType<typeof createStatsBarStore>

/**
 * The frame and scene stats of the toolbar. They are plain engine values, sampled on each tick.
 */
export function createStatsBarStore(props: { viewer: NwViewer }) {
  const tick = createInterval(SAMPLE_INTERVAL)
  const viewer = () => {
    tick()
    return props.viewer
  }
  const [state] = createStore<StatsBarState>({
    get tasks() {
      return viewer().schedulerStats?.total || 0
    },
    get fps() {
      return Math.floor(viewer().stats.fps.average)
    },
    get frameMs() {
      return viewer().stats.frameTime.average * 1000
    },
    get updateMs() {
      return viewer().world.stats.update.average
    },
    get drawMs() {
      return viewer().stats.draw.average
    },
    get draws() {
      return viewer().renderStats?.drawCount ?? 0
    },
    get visible() {
      return viewer().sceneStats?.visible ?? 0
    },
  })
  return { state }
}

/**
 * Color stops of the task counter: up to 50 tasks the text color, then a blend to orange at 500 and to red at 1000
 */
const TASK_COLOR_STOPS: Array<{ tasks: number; color: string }> = [
  { tasks: 50, color: 'var(--nw-text)' },
  { tasks: 500, color: 'orange' },
  { tasks: 1000, color: 'red' },
]

/**
 * CSS color of the task counter for a number of pending tasks, null up to the first stop (the text color as is)
 */
export function taskCountColor(tasks: number): string | null {
  const stops = TASK_COLOR_STOPS
  if (!(tasks > stops[0].tasks)) {
    return null
  }
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1]
    const to = stops[i]
    if (tasks < to.tasks) {
      const percent = Math.round(((tasks - from.tasks) / (to.tasks - from.tasks)) * 100)
      return `color-mix(in oklab, ${to.color} ${percent}%, ${from.color})`
    }
  }
  return stops[stops.length - 1].color
}

/**
 * A stat value with fixed fraction digits, padded with zeros to a width so the bar does not jump. `-` for values
 * that are not finite.
 */
export function formatStat(value: number, decimals = 0, width = 0): string {
  if (!Number.isFinite(value)) {
    return '-'
  }
  return value.toFixed(decimals).padStart(width, '0')
}
