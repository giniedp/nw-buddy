import { AnimationMixer, AnimationPose, AnimationRig, AnimationTrackClip } from '@gglib/model'
import { describe, expect, it } from 'vitest'
import { MotionParam, prepareParaGroup } from './blendSpace'
import { addRootMotion, blendSpaceSource, characterClipSource, CharacterMotion, clipTravel } from './sources'

const ROOT = 100
const CHILD = 200

/**
 * Two joints: a root (controller 100) and a child (controller 200), identity defaults
 */
function createRig() {
  return new AnimationRig({
    names: ['Bip01', 'Bip01 Pelvis'],
    parents: [-1, 0],
    defaultPose: new AnimationPose(2),
    targets: [ROOT, CHILD],
  })
}

/**
 * A clip of 30 frames at 30 fps: the root moves `speed` units per second along x, the child sits at `child` on x
 */
function createClip(name: string, speed: number, child: number) {
  const frames = 30
  return new AnimationTrackClip({
    name,
    start: 0,
    end: frames,
    rate: 30,
    tracks: [
      {
        target: ROOT,
        channel: 'translation',
        times: new Float32Array([0, frames]),
        values: new Float32Array([0, 0, 0, speed, 0, 0]),
        interpolation: 'LINEAR',
      },
      {
        target: CHILD,
        channel: 'translation',
        times: new Float32Array([0]),
        values: new Float32Array([child, 0, 0]),
        interpolation: 'LINEAR',
      },
    ],
  })
}

/**
 * A 1D MoveSpeed blend space from `walk` at 1 to `run` at 3
 */
function locomotion() {
  return prepareParaGroup('locomotion', {
    kind: 'paragroup',
    dimensions: [
      {
        name: 'MoveSpeed',
        min: 1,
        max: 3,
        cells: 3,
        scale: 1,
        jointName: '',
        skey: null,
        ekey: null,
        locked: false,
        paraScale: null,
        chooseBlendSpace: false,
      },
    ],
    additionalExtraction: [],
    examples: [
      { animation: 'walk', blendExample: '', playbackScale: 1, params: [1, null, null, null] },
      { animation: 'run', blendExample: '', playbackScale: 1, params: [3, null, null, null] },
    ],
    pseudoExamples: [],
    faces: [[0, 1]],
    virtualGrid: null,
    jointList: [],
    threshold: null,
    rampZ: null,
    idleToMove: false,
    timewarpGroup: '',
  })
}

describe('clipTravel', () => {
  it('measures the root over the keys, the count truncated as the game does', () => {
    const travel = clipTravel(createClip('walk', 3, 0), ROOT)
    expect(travel.duration).toBeCloseTo(1)
    // 31 keys, 30 steps of 0.1
    expect(travel.distance).toBeCloseTo(3)
    expect(travel.speed).toBeCloseTo(3)
  })

  it('does not travel without a root translation', () => {
    const travel = clipTravel(createClip('idle', 0, 0), 999)
    expect(travel).toEqual({ duration: expect.closeTo(1), distance: 0, speed: 0 })
  })
})

describe('characterClipSource', () => {
  it('keeps the root at the clip start in place, lets it travel otherwise', () => {
    const rig = createRig()
    const motion = new CharacterMotion()
    const source = characterClipSource(rig.bind(createClip('walk', 3, 0)), motion)
    const state = source.createState()
    const pose = new AnimationPose(2)
    source.sample(0.5, pose, state, false)
    expect(pose.translations[0]).toBeCloseTo(0)
    motion.inPlace = false
    source.sample(0.5, pose, state, false)
    expect(pose.translations[0]).toBeCloseTo(1.5)
  })
})

describe('blendSpaceSource', () => {
  it('weighs the clips by the motion parameter and steps by the weighted travel', () => {
    const rig = createRig()
    const motion = new CharacterMotion()
    // walk: 1 unit per second, run: 3 units per second, both one second long
    const bindings = [rig.bind(createClip('walk', 1, 1)), rig.bind(createClip('run', 3, 3))]
    const source = blendSpaceSource(locomotion(), bindings, rig, motion)

    motion.params[MotionParam.TravelSpeed] = 2
    const state = source.createState()
    expect(Array.from(state.weights)).toEqual([0.5, 0.5])
    // weighted speed 2 over weighted distance 2: one cycle per second
    expect(source.step(0, 0.25, state)).toBeCloseTo(0.25)
    expect(source.duration).toBeCloseTo(1)

    const pose = new AnimationPose(2)
    source.sample(0.5, pose, state, false)
    // the child sits halfway between the clips, the root stays in place
    expect(pose.translations[3]).toBeCloseTo(2)
    expect(pose.translations[0]).toBeCloseTo(0)

    motion.params[MotionParam.TravelSpeed] = 3
    source.step(0, 0, state)
    // the maximum stays 0.001 short of the last cell
    expect(state.weights[1]).toBeCloseTo(0.9995, 4)
  })

  it('keeps a locked dimension at its value from the entry start', () => {
    const rig = createRig()
    const motion = new CharacterMotion()
    const space = locomotion()
    space.dimensions[0].locked = true
    const bindings = [rig.bind(createClip('walk', 1, 1)), rig.bind(createClip('run', 3, 3))]
    const source = blendSpaceSource(space, bindings, rig, motion)
    motion.params[MotionParam.TravelSpeed] = 1
    const state = source.createState()
    motion.params[MotionParam.TravelSpeed] = 3
    source.step(0, 0.1, state)
    expect(Array.from(state.weights)).toEqual([1, 0])
  })

  it('plays on a mixer', () => {
    const rig = createRig()
    const motion = new CharacterMotion()
    motion.params[MotionParam.TravelSpeed] = 3
    const bindings = [rig.bind(createClip('walk', 1, 1)), rig.bind(createClip('run', 3, 3))]
    const mixer = new AnimationMixer(rig)
    const entry = mixer.play(blendSpaceSource(locomotion(), bindings, rig, motion), { loop: true })
    mixer.update(0.5)
    expect(entry.time).toBeCloseTo(0.5)
    const pose = new AnimationPose(2)
    mixer.evaluate(pose)
    expect(pose.translations[3]).toBeCloseTo(3)
  })
})

describe('addRootMotion', () => {
  // the root turns 90 degrees to the left (about z) while it moves 1 unit along the model's y
  const s = Math.SQRT1_2
  const clip = new AnimationTrackClip({
    name: 'turn',
    start: 0,
    end: 30,
    rate: 30,
    tracks: [
      {
        target: ROOT,
        channel: 'translation',
        times: new Float32Array([0, 30]),
        values: new Float32Array([0, 0, 0, 0, 1, 0]),
        interpolation: 'LINEAR',
      },
      {
        target: ROOT,
        channel: 'rotation',
        times: new Float32Array([0, 30]),
        values: new Float32Array([0, 0, 0, 1, 0, 0, s, s]),
        interpolation: 'LINEAR',
      },
    ],
  })

  it('gives the turn and the travel in the frame the character faces', () => {
    const whole = new Float32Array(4)
    addRootMotion(clip, ROOT, 0, 1, false, whole)
    expect(Array.from(whole).map((it) => +it.toFixed(4))).toEqual([0, 1, 0, +(Math.PI / 2).toFixed(4)])
    // two steps in one window add up to the same
    const window = new Float32Array(4)
    addRootMotion(clip, ROOT, 0, 0.5, false, window)
    addRootMotion(clip, ROOT, 0.5, 1, false, window)
    expect(window[1]).toBeCloseTo(1, 4)
    expect(window[3]).toBeCloseTo(Math.PI / 2, 4)
    // the second half alone: the character already turned 45 degrees left, the model's y lies to its right front
    const second = new Float32Array(4)
    addRootMotion(clip, ROOT, 0.5, 1, false, second)
    expect(second[0]).toBeCloseTo(0.5 * Math.SQRT1_2, 3)
    expect(second[1]).toBeCloseTo(0.5 * Math.SQRT1_2, 3)
    expect(second[3]).toBeCloseTo(Math.PI / 4, 3)
  })
})
