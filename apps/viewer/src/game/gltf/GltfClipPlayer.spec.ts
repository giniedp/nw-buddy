import { Transform, vec3 } from '@gglib/math'
import type { AnimationData, NodeData } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import { GltfClipPlayer, retargetClip } from './GltfClipPlayer'

function node(controllerId?: number): Transform<NodeData> {
  const result = new Transform<NodeData>()
  result.data = { extras: controllerId == null ? {} : { controllerId } } as NodeData
  return result
}

/**
 * A clip that moves its target linearly in x from 0 to `to` over `duration` seconds
 */
function clip(name: string, target: number, duration: number, to = 1): AnimationData {
  return {
    name,
    channels: [
      {
        target,
        translation: {
          interpolation: 'LINEAR',
          samples: [
            { time: 0, value: vec3(0, 0, 0) },
            { time: duration, value: vec3(to, 0, 0) },
          ],
        },
      },
    ],
  }
}

describe('retargetClip', () => {
  it('maps the channel targets by controller id and drops unknown nodes', () => {
    const nodes = [node(10), node(20), node()]
    const data: AnimationData = {
      name: 'clip',
      channels: [clip('a', 0, 1).channels[0], clip('b', 1, 1).channels[0], clip('c', 2, 1).channels[0]],
    }
    const result = retargetClip(data, nodes, new Map([[20, 5]]))
    expect(result.channels.map((it) => it.target)).toEqual([5])
    expect(data.channels.map((it) => it.target)).toEqual([0, 1, 2])
  })
})

describe('GltfClipPlayer', () => {
  it('plays a start clip, then loops the last one', () => {
    const joint = new Transform()
    const player = new GltfClipPlayer([joint])
    player.setSequence([
      { data: clip('start', 0, 1, 1), loop: false },
      { data: clip('loop', 0, 2, 4), loop: true },
    ])
    expect(player.duration).toBe(3)
    player.update(0.5)
    expect(joint.translation.x).toBeCloseTo(0.5)
    player.update(1)
    // 1.5: half a second into the loop
    expect(joint.translation.x).toBeCloseTo(1)
    player.update(2)
    // 3.5 wraps to 1.5 in the loop clip
    expect(player.time).toBeCloseTo(1.5)
    expect(player.playing).toBe(true)
  })

  it('stops at the end of a sequence without a loop', () => {
    const joint = new Transform()
    const player = new GltfClipPlayer([joint])
    player.setSequence([{ data: clip('once', 0, 1, 2), loop: false }])
    player.update(5)
    expect(player.time).toBe(1)
    expect(player.playing).toBe(false)
    expect(player.ended).toBe(true)
    expect(joint.translation.x).toBeCloseTo(2)
  })

  it('plays an ended sequence again from the start', () => {
    const joint = new Transform()
    const player = new GltfClipPlayer([joint])
    player.setSequence([{ data: clip('once', 0, 2, 2), loop: false }])
    player.update(5)
    player.playing = true
    expect(player.time).toBe(0)
    expect(player.ended).toBe(false)
    player.update(0.5)
    expect(player.playing).toBe(true)
    expect(joint.translation.x).toBeCloseTo(0.5)
  })

  it('resumes a paused sequence where it stands', () => {
    const joint = new Transform()
    const player = new GltfClipPlayer([joint])
    player.setSequence([{ data: clip('once', 0, 2, 2), loop: false }])
    player.update(0.5)
    player.playing = false
    player.playing = true
    player.update(0.5)
    expect(player.time).toBeCloseTo(1)
  })

  it('scrubs while paused and restores the rest pose without a sequence', () => {
    const joint = new Transform()
    joint.translation.y = 7
    const player = new GltfClipPlayer([joint])
    player.setSequence([{ data: clip('once', 0, 2, 2), loop: false }])
    player.playing = false
    player.time = 1
    expect(player.update(0.5)).toBe(true)
    expect(joint.translation.x).toBeCloseTo(1)
    player.setSequence([])
    player.update(0)
    expect(joint.translation.x).toBe(0)
    expect(joint.translation.y).toBe(7)
  })
})
