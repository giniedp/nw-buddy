import type { AdbProcedural } from '../../../formats/mannequin'
import type { FragmentTimeline, TimelineBar } from '../../../game/character/mannequin/timeline'

/**
 * A link of a bar's details, e.g. the page of a damage row
 */
export interface TrackBarLink {
  label: string
  href: string
}

export interface TrackBarProps {
  /**
   * The playing fragment, null shows nothing
   */
  timeline: FragmentTimeline | null
  /**
   * Seconds on the timeline
   */
  time: number
  /**
   * Seeks to a time (click or drag on the track), without it the track is read only
   */
  onSeek?: (time: number) => void
  /**
   * Plays the fragment again (double click)
   */
  onReplay?: () => void
  /**
   * The link of a bar, shown in its details; null for none
   */
  link?: (bar: TimelineBar) => TrackBarLink | null
  class?: string
}

/**
 * How a bar is colored, by its procedural type
 */
export type TrackBarKind = 'damage' | 'spell' | 'homing' | 'other'

/**
 * A procedural clip laid out on its row, in percent of the fragment's duration
 */
export interface TrackBarItem {
  /**
   * The proc layer and the index of the bar in it
   */
  layer: number
  index: number
  left: number
  width: number
  kind: TrackBarKind
  procedural: AdbProcedural
  bar: TimelineBar
}

export interface TrackBarState {
  /**
   * A drag on the track seeks
   */
  dragging: boolean
  /**
   * The playhead in percent of the duration
   */
  readonly playhead: number
}
