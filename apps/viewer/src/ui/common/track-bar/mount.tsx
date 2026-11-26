import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import type { FragmentTimeline, TimelineBar } from '../../../game/character/mannequin/timeline'
import tokensCss from '../../styles/tokens.css?inline'
import { TrackBar } from './TrackBar'
import trackBarCss from './TrackBar.css?inline'
import type { TrackBarLink } from './types'

/**
 * What a mounted track bar shows, see {@link mountTrackBar}
 */
export interface TrackBarSource {
  timeline: FragmentTimeline | null
  /**
   * Seconds on the timeline
   */
  time: number
  /**
   * Seeks to a time, without it the track is read only
   */
  seek?: (time: number) => void
  /**
   * Plays the fragment again (double click)
   */
  replay?: () => void
}

export interface TrackBarMountOptions {
  /**
   * The link of a bar, shown in its details (e.g. a damage row's page); null for none
   */
  link?: (bar: TimelineBar) => TrackBarLink | null
}

export interface MountedTrackBar {
  /**
   * Shows a fragment and its time; call it whenever the time changes (e.g. per animation frame)
   */
  update(source: TrackBarSource | null): void
  /**
   * Unmounts the track bar
   */
  dispose(): void
}

let styleElement: HTMLStyleElement | null = null
let styleUsers = 0

/**
 * Renders the track bar of a playing fragment (e.g. of `ModelViewer.mannequin`) into an element of a host page. Brings
 * its own styles: the viewer's tokens and the track bar's, no other viewer styles.
 *
 * ```ts
 * const bar = mountTrackBar(element, { link: (bar) => null })
 * // per frame
 * bar.update({ timeline: mannequin.timeline, time: mannequin.time, seek: (t) => (mannequin.time = t) })
 * ```
 */
export function mountTrackBar(element: HTMLElement, options: TrackBarMountOptions = {}): MountedTrackBar {
  const [source, setSource] = createSignal<TrackBarSource | null>(null)
  const [time, setTime] = createSignal(0)
  const [timeline, setTimeline] = createSignal<FragmentTimeline | null>(null)
  addStyles()
  const unmount = render(
    () => (
      <TrackBar
        timeline={timeline()}
        time={time()}
        onSeek={source()?.seek ? (value) => source()?.seek?.(value) : undefined}
        onReplay={() => source()?.replay?.()}
        link={options.link}
      />
    ),
    element,
  )
  return {
    update(next) {
      // the timeline changes rarely, the time every frame: separate signals keep the bars as they are
      setSource(next)
      setTimeline(next?.timeline ?? null)
      setTime(next?.time ?? 0)
    },
    dispose() {
      unmount()
      removeStyles()
    },
  }
}

function addStyles() {
  styleUsers++
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.textContent = `${tokensCss}\n${trackBarCss}`
    document.head.append(styleElement)
  }
}

function removeStyles() {
  styleUsers--
  if (styleUsers <= 0) {
    styleUsers = 0
    styleElement?.remove()
    styleElement = null
  }
}
