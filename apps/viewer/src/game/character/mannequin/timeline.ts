import type { AdbFragment, AdbProcedural } from '../../../formats/mannequin'
import { assembleFragment } from './transitions'

/**
 * A clip of an animation layer of a {@link FragmentTimeline}
 */
export interface TimelineClip {
  /**
   * Seconds after the fragment start the clip installs
   */
  start: number
  /**
   * Seconds after the fragment start the next clip of the layer installs, or the fragment's end
   */
  end: number
  /**
   * The animation, null for an empty entry: layer 0 holds its pose, other layers stop
   */
  name: string | null
  loop: boolean
  speed: number
  weight: number
  /**
   * The blend's `StartTime`: where the clip starts
   */
  startTime: number
  /**
   * Seconds the clip fades in over the clip before it
   */
  fade: number
}

/**
 * A procedural clip of a proc layer of a {@link FragmentTimeline}
 */
export interface TimelineBar {
  start: number
  /**
   * Seconds after the fragment start the next bar starts, or the fragment's end
   */
  end: number
  /**
   * Null for a gap: an empty procedural clip (`type=""`), or the time before the first clip
   */
  procedural: AdbProcedural | null
}

/**
 * A fragment variant laid out in seconds: the clips of its animation layers and the bars of its proc layers, for
 * playback and display
 */
export interface FragmentTimeline {
  /**
   * Seconds of the fragment, at least the start of every clip and bar
   */
  duration: number
  /**
   * Set when the last clip of layer 0 loops: past the duration the playback repeats `start` to `start + length`
   */
  loop: { start: number; length: number } | null
  animLayers: TimelineClip[][]
  procLayers: TimelineBar[][]
}

/**
 * A fragment's duration when nothing gives one (e.g. only looping clips of unknown length)
 */
const FALLBACK_DURATION = 1

/**
 * Lays out a fragment variant: the animation layers by the Mannequin sequencing rules ({@link assembleFragment}: exit
 * times after the previous clip, a negative exit time waits for the previous clip's reference length), the proc
 * layers by their delays (each clip enters when its blend's exit time has passed after the clip before).
 *
 * @param duration - seconds of an animation by name, null when unknown
 */
export function fragmentTimeline(fragment: AdbFragment, duration: (name: string) => number | null): FragmentTimeline {
  const assembled = assembleFragment([], fragment, duration)
  const animLayers: TimelineClip[][] = []
  let end = 0
  let loop: FragmentTimeline['loop'] = null
  assembled.layers.forEach((layer, index) => {
    const clips: TimelineClip[] = []
    let time = 0
    for (const clip of layer) {
      time += clip.blend.exitTime
      const animation = clip.animation
      clips.push({
        start: time,
        end: time,
        name: animation?.name || null,
        loop: clip.loop,
        speed: animation?.speed ?? 1,
        weight: animation?.weight ?? 1,
        startTime: clip.blend.startTime,
        fade: clip.blend.duration,
      })
    }
    const last = clips[clips.length - 1]
    if (last) {
      let layerEnd = last.start
      if (last.name && last.loop) {
        const seconds = duration(last.name)
        const length = seconds != null && last.speed > 0 ? seconds / last.speed : 0
        layerEnd += length
        if (index === 0 && length > 0) {
          loop = { start: last.start, length }
        }
      } else if (last.name) {
        layerEnd += layer[layer.length - 1].referenceLength
      }
      end = Math.max(end, layerEnd)
    }
    animLayers.push(clips)
  })

  const procLayers: TimelineBar[][] = []
  for (const layer of fragment.procLayers) {
    const bars: TimelineBar[] = []
    let time = 0
    for (const item of layer.sequence) {
      time += Math.max(0, item.blend.exitTime)
      const procedural = item.procedural?.type ? item.procedural : null
      bars.push({ start: time, end: time, procedural })
    }
    if (bars.length && bars[0].start > 0) {
      bars.unshift({ start: 0, end: bars[0].start, procedural: null })
    }
    for (const bar of bars) {
      end = Math.max(end, bar.start)
    }
    procLayers.push(bars)
  }

  if (end <= 0) {
    end = FALLBACK_DURATION
  }
  for (const layer of [...animLayers, ...procLayers]) {
    for (let i = 0; i < layer.length; i++) {
      layer[i].end = i + 1 < layer.length ? layer[i + 1].start : end
    }
  }
  return { duration: end, loop, animLayers, procLayers }
}

/**
 * The time on the timeline for a playback time: past the duration a looping fragment repeats its loop, a one shot
 * stays at its end
 */
export function timelineTime(timeline: FragmentTimeline, time: number): number {
  if (time <= timeline.duration) {
    return Math.max(0, time)
  }
  const loop = timeline.loop
  if (!loop) {
    return timeline.duration
  }
  return loop.start + ((time - loop.start) % loop.length)
}

/**
 * The index of the bar of a proc layer that runs at a time, -1 for none (before the first bar or a gap)
 */
export function timelineBarAt(bars: ReadonlyArray<TimelineBar>, time: number): number {
  for (let i = bars.length - 1; i >= 0; i--) {
    const bar = bars[i]
    if (time >= bar.start) {
      return bar.procedural ? i : -1
    }
  }
  return -1
}
