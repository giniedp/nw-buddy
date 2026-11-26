import { For, Show } from 'solid-js'
import type { NwViewer } from '../../../viewer'
import { createStatsBarStore, formatStat } from './StatsBar.store'
import type { StatsBarState } from './types'
import './StatsBar.css'

interface StatView {
  key: keyof StatsBarState
  /**
   * Text before the value
   */
  label?: string
  /**
   * Text after the value
   */
  unit?: string
  /**
   * Fraction digits, defaults to 0
   */
  decimals?: number
  /**
   * Pads the value with zeros to this width
   */
  width?: number
  /**
   * Tooltip: what the value is
   */
  title: string
}

const STATS: StatView[] = [
  { key: 'tasks', unit: 'Tasks', title: 'Pending loading tasks' },
  { key: 'fps', width: 3, unit: 'FPS', title: 'Frames per second (average)' },
  { key: 'frameMs', decimals: 2, width: 5, unit: 'ms', title: 'Frame time in milliseconds (average)' },
  {
    key: 'updateMs',
    label: 'update',
    decimals: 2,
    width: 5,
    title: 'Update of the game world in milliseconds (average)',
  },
  { key: 'drawMs', label: 'draw', decimals: 2, width: 5, title: 'Draw on the CPU in milliseconds (average)' },
  { key: 'draws', width: 4, unit: 'Draws', title: 'Draw calls per frame' },
  { key: 'visible', width: 4, unit: 'Visible', title: 'Visible scene objects' },
]

/**
 * Frame and scene stats in the toolbar, updated twice a second
 */
export function StatsBar(props: { viewer: NwViewer }) {
  const store = createStatsBarStore(props)
  return (
    <div class="nw-stats-bar">
      <For each={STATS}>
        {(stat) => (
          <span class="nw-stat" title={stat.title}>
            <Show when={stat.label}>
              <span class="nw-muted">{stat.label} </span>
            </Show>
            {formatStat(store.state[stat.key], stat.decimals, stat.width)}
            <Show when={stat.unit}>
              <span class="nw-muted"> {stat.unit}</span>
            </Show>
          </span>
        )}
      </For>
    </div>
  )
}
