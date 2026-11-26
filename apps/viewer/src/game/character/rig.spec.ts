import { AnimationClipCursor, AnimationPose, AnimationRig, poseIdentity, poseToModel, sampleClip } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import type { CafClip } from '../../formats/caf'
import type { CgfBone } from '../../formats/cgf'
import { createCafClip, createCharacterRig, skinJointMap } from './rig'

/**
 * Column major 4x4 of a rotation about z and a translation
 */
function transform(angle: number, x: number, y: number, z: number): Float32Array {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return Float32Array.from([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, x, y, z, 1])
}

function bone(name: string, parent: number, controllerId: number, boneToWorld: Float32Array): CgfBone {
  return { name, parent, controllerId, limbId: 0, boneToWorld, worldToBone: new Float32Array(16) }
}

function translation(pose: AnimationPose, joint: number) {
  return Array.from(pose.translations.subarray(joint * 3, joint * 3 + 3)).map((it) => Math.round(it * 1e5) / 1e5)
}

describe('createCharacterRig', () => {
  it('derives relative defaults that compose back to the bone transforms', () => {
    const bones = [
      bone('root', -1, 11, transform(Math.PI / 2, 1, 0, 0)),
      bone('spine', 0, 22, transform(Math.PI / 2, 1, 2, 0)),
      bone('head', 1, 33, transform(Math.PI, 0, 3, 1)),
    ]
    const rig = createCharacterRig(bones)
    expect(rig.targets).toEqual([11, 22, 33])
    // spine is 2 along the root's local -x... in model space (1, 2, 0), relative to a root turned 90° about z
    expect(translation(rig.defaultPose, 1)).toEqual([2, 0, 0])
    const model = poseToModel(rig.defaultPose, rig.parents, new AnimationPose(3))
    expect(translation(model, 2)).toEqual([0, 3, 1])
  })

  it('applies the Bip01 rule', () => {
    const bones = [
      bone('Bip01', -1, 1, transform(Math.PI / 2, 5, 0, 0)),
      bone('Bip01 Pelvis', 0, 2, transform(0, 5, 0, 1)),
      bone('Bip01 Spine', 1, 3, transform(0, 5, 0, 2)),
    ]
    const rig = createCharacterRig(bones)
    expect(translation(rig.defaultPose, 0)).toEqual([0, 0, 0])
    expect(Array.from(rig.defaultPose.rotations.subarray(0, 4))).toEqual([0, 0, 0, 1])
    // the direct child takes its model transform, deeper joints stay relative
    expect(translation(rig.defaultPose, 1)).toEqual([5, 0, 1])
    expect(translation(rig.defaultPose, 2)).toEqual([0, 0, 1])
  })
})

describe('createCafClip', () => {
  it('shares the decoded tracks and keeps the played range', () => {
    const times = Float32Array.from([0, 30])
    const caf: CafClip = {
      sampleRate: 30,
      startFrame: 1,
      endFrame: 30,
      additive: true,
      cycle: false,
      motion: null,
      controllers: [
        {
          controllerId: 22,
          flags: 0,
          rotationTimes: times,
          rotations: Float32Array.from([0, 0, 0, 1, 0, 0, 1, 0]),
          positionTimes: times,
          positions: Float32Array.from([0, 0, 0, 3, 0, 0]),
        },
        { controllerId: 99, flags: 0, rotationTimes: null, rotations: null, positionTimes: null, positions: null },
      ],
    }
    const clip = createCafClip('test', caf)
    expect(clip.tracks.map((it) => [it.target, it.channel])).toEqual([
      [22, 'rotation'],
      [22, 'translation'],
    ])
    expect(clip.tracks[0].times).toBe(times)
    expect(clip.start).toBe(1)
    expect(clip.end).toBe(30)
    expect(clip.duration).toBeCloseTo(29 / 30)
    expect(clip.additive).toBe(true)

    const rig = createCharacterRig([
      bone('root', -1, 11, transform(0, 0, 0, 0)),
      bone('spine', 0, 22, transform(0, 1, 0, 0)),
    ])
    const pose = new AnimationPose(2)
    sampleClip(rig.bind(clip), new AnimationClipCursor(clip), 15, pose, true)
    expect(translation(pose, 1)).toEqual([1.5, 0, 0])
  })
})

describe('skinJointMap', () => {
  const rig = new AnimationRig({
    names: ['Root', 'Pelvis', 'Spine', 'Head'],
    parents: [-1, 0, 1, 2],
    defaultPose: poseIdentity(new AnimationPose(4)),
  })

  it('matches by lower case name, in the skin order', () => {
    const map = skinJointMap(rig, { names: ['head', 'ROOT', 'Spine'], parents: [2, -1, 1] })
    expect(Array.from(map)).toEqual([3, 0, 2])
  })

  it('maps a bone the skeleton lacks to its nearest ancestor that it has, else the root', () => {
    const map = skinJointMap(rig, {
      names: ['Root', 'Spine', 'Hair_01', 'Hair_02', 'Loose'],
      parents: [-1, 0, 1, 2, -1],
    })
    expect(Array.from(map)).toEqual([0, 2, 2, 2, 0])
  })
})
