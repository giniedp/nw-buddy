import type { GraphRow } from 'tweak-ui'

/**
 * Frame and scene stats of the toolbar, sampled twice a second
 */
export interface StatsBarState {
  /**
   * Pending loading tasks
   */
  readonly tasks: number
  /**
   * Frames per second (average)
   */
  readonly fps: number
  /**
   * Frame time in milliseconds (average)
   */
  readonly frameMs: number
  /**
   * Update of the game world in milliseconds (average)
   */
  readonly updateMs: number
  /**
   * Draw on the CPU in milliseconds (average)
   */
  readonly drawMs: number
  /**
   * Draw calls per frame
   */
  readonly draws: number
  /**
   * Visible scene objects
   */
  readonly visible: number
}

/**
 * A tab of the stats graphs
 */
export interface GraphTab {
  title: string
  rows: GraphRow[]
}
