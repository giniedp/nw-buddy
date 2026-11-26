import { describe, expect, it } from 'vitest'
import type { CharacterAnimationFile } from '../../api'
import { pickIdleAnimation, timelineLayerClips } from './CharacterAssets'

describe('pickIdleAnimation', () => {
  const clip = (name: string): CharacterAnimationFile => ({ name, file: `${name}.caf`, type: 'caf' })

  it('prefers a calm idle over intro and combat idles', () => {
    const set = ['scorpion_intro_idle', 'scorpion_ambient_idle', 'scorpion_combat_idle'].map(clip)
    expect(pickIdleAnimation(set)?.name).toBe('scorpion_ambient_idle')
  })

  it('takes an intro idle when no other idle exists', () => {
    const set = ['walk', 'scorpion_intro_idle'].map(clip)
    expect(pickIdleAnimation(set)?.name).toBe('scorpion_intro_idle')
  })
})

function animationClip(alias: string, start: number, speed = 1) {
  return {
    __type: 'AZStd::intrusive_ptr',
    element: {
      __type: 'AnimationClip',
      baseclass1: { __type: 'TimelineClip', starttime: start, endtime: start + 10 },
      animationalias: alias,
      loop: true,
      playbackspeed: speed,
      animationstarttime: 0,
    },
  }
}

// the shape of nwbt's json of a .timeline (pvp_arena_announcer.timeline): single elements are objects
const SINGLE = {
  __type: 'Timeline',
  layers: {
    __type: 'AZStd::vector',
    element: {
      __type: 'TimelineLayer',
      id: 'e8a838a9-92c8-4b9d-b69f-a5c2b70d2915',
      name: 'Animate_Character',
      clips: { __type: 'AZStd::vector', element: animationClip('mc_damned_poi_worshipping_praying_01', 0) },
    },
  },
}

const MANY = {
  __type: 'Timeline',
  layers: {
    __type: 'AZStd::vector',
    element: [
      { __type: 'TimelineLayer', id: 'a', name: 'Camera', clips: { element: [] } },
      {
        __type: 'TimelineLayer',
        id: 'B',
        name: 'Animate_Npc',
        clips: {
          element: [
            animationClip('second', 5, 0.5),
            { element: { __type: 'SoundClip', baseclass1: { starttime: 0 } } },
            animationClip('first', 0),
          ],
        },
      },
    ],
  },
}

describe('timelineLayerClips', () => {
  it('reads the animation clips of a layer with a single clip', () => {
    expect(timelineLayerClips(SINGLE, { timeline: 'x.timeline', layer: 'animate_character' })).toEqual([
      { animation: 'mc_damned_poi_worshipping_praying_01', start: 0, end: 10, loop: true, speed: 1, animationStart: 0 },
    ])
  })

  it('finds the layer by id first, keeps animation clips only, in timeline order', () => {
    const clips = timelineLayerClips(MANY, { timeline: 'x.timeline', layer: 'Camera', layerId: 'b' })
    expect(clips.map((it) => [it.animation, it.speed])).toEqual([
      ['first', 1],
      ['second', 0.5],
    ])
  })

  it('has no clips for an unknown layer', () => {
    expect(timelineLayerClips(MANY, { timeline: 'x.timeline', layer: 'Missing' })).toEqual([])
  })
})
