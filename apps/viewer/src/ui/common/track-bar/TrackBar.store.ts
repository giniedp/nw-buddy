import { createMemo, createSignal, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { AdbProcedural } from '../../../formats/mannequin'
import { timelineBarAt, type FragmentTimeline } from '../../../game/character/mannequin/timeline'
import type { TrackBarItem, TrackBarKind, TrackBarProps, TrackBarState } from './types'

/**
 * Milliseconds the details stay after the pointer left the bar, so the pointer can move into them (to the link)
 */
const HIDE_DELAY = 150

/**
 * The color of a procedural type
 */
export function trackBarKind(type: string): TrackBarKind {
  switch (type) {
    case 'CAGE-Damage':
      return 'damage'
    case 'CAGE-CastSpell':
    case 'CAGE-RangedAttack':
      return 'spell'
    case 'Homing':
      return 'homing'
    default:
      return 'other'
  }
}

/**
 * The bars of each proc layer in percent of the duration, gaps left out
 */
export function trackRows(timeline: FragmentTimeline | null): TrackBarItem[][] {
  if (!timeline) {
    return []
  }
  const duration = timeline.duration || 1
  return timeline.procLayers.map((bars, layer) => {
    const items: TrackBarItem[] = []
    bars.forEach((bar, index) => {
      if (!bar.procedural) {
        return
      }
      items.push({
        layer,
        index,
        left: (bar.start / duration) * 100,
        width: (Math.max(0, bar.end - bar.start) / duration) * 100,
        kind: trackBarKind(bar.procedural.type),
        procedural: bar.procedural,
        bar,
      })
    })
    return items
  })
}

/**
 * The params of a procedural clip as text, in their order
 */
export function paramEntries(procedural: AdbProcedural): Array<[string, string]> {
  return Object.entries(procedural.params).map(([name, value]) => {
    return [name, Array.isArray(value) ? value.join(', ') : value]
  })
}

/**
 * Seconds of a time range as text, e.g. `0.50 – 0.70 s`
 */
export function barTimes(item: TrackBarItem): string {
  return `${item.bar.start.toFixed(2)} – ${item.bar.end.toFixed(2)} s`
}

export type TrackBarStore = ReturnType<typeof createTrackBarStore>

/**
 * The state and actions of the track bar: the rows of the timeline, the active bars at the time, the hovered bar and
 * seeking by the pointer
 */
export function createTrackBarStore(props: TrackBarProps) {
  const rows = createMemo(() => trackRows(props.timeline))
  // the bar index that runs per proc layer, -1 for none: changes only when a bar starts or ends
  const active = createMemo(
    () => (props.timeline?.procLayers ?? []).map((layer) => timelineBarAt(layer, props.time)),
    [],
    { equals: (a, b) => a.length === b.length && a.every((it, i) => it === b[i]) },
  )
  // the hovered bar is an object of the rows: a store would merge the next bar into it instead of replacing it
  const [hovered, setHovered] = createSignal<TrackBarItem | null>(null)
  const [state, setState] = createStore<TrackBarState>({
    dragging: false,
    get playhead() {
      const duration = props.timeline?.duration || 1
      return Math.min(100, Math.max(0, (props.time / duration) * 100))
    },
  })
  const link = createMemo(() => {
    const item = hovered()
    return item && props.link ? props.link(item.bar) : null
  })

  let hideTimer: ReturnType<typeof setTimeout> | null = null
  const cancelHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }
  onCleanup(cancelHide)

  const seekAt = (fraction: number) => {
    const timeline = props.timeline
    if (timeline && props.onSeek) {
      props.onSeek(Math.min(1, Math.max(0, fraction)) * timeline.duration)
    }
  }

  return {
    state,
    rows,
    /**
     * The bar whose details show
     */
    hovered,
    link,
    get seekable() {
      return !!props.onSeek && !!props.timeline
    },
    isActive(item: TrackBarItem) {
      return active()[item.layer] === item.index
    },
    /**
     * The pointer is on a bar (or its details): they show
     */
    hover(item: TrackBarItem) {
      cancelHide()
      if (!state.dragging) {
        setHovered(item)
      }
    },
    /**
     * The pointer is on the details
     */
    keep() {
      cancelHide()
    },
    /**
     * The pointer left the bar or the details: they hide unless it comes back
     */
    leave() {
      cancelHide()
      hideTimer = setTimeout(() => setHovered(null), HIDE_DELAY)
    },
    /**
     * Pointer down on the track at a fraction of its width: seeks and starts a drag
     */
    startSeek(fraction: number) {
      if (!props.onSeek || !props.timeline) {
        return
      }
      setState('dragging', true)
      setHovered(null)
      seekAt(fraction)
    },
    moveSeek(fraction: number) {
      if (state.dragging) {
        seekAt(fraction)
      }
    },
    endSeek() {
      setState('dragging', false)
    },
    replay() {
      props.onReplay?.()
    },
  }
}
