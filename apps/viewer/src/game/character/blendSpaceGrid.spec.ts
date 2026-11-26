import { describe, expect, it } from 'vitest'
import type { BlendSpaceDimension, BlendSpaceExample, ParaGroupBlendSpace } from '../../formats/bspace'
import { MotionParam, type PreparedDimension } from './blendSpace'
import { blendParameters, buildGridFromFaces, weights2D } from './blendSpaceFaces'
import { buildGridFromNearest } from './blendSpaceNearest'

function dimension(name: string, min: number, max: number, cells: number): BlendSpaceDimension {
  return {
    name,
    min,
    max,
    cells,
    scale: 1,
    jointName: '',
    skey: null,
    ekey: null,
    locked: false,
    paraScale: null,
    chooseBlendSpace: false,
  }
}

function prepared(it: BlendSpaceDimension, param: number): PreparedDimension {
  return {
    name: it.name,
    param,
    min: it.min,
    max: it.max,
    cells: it.cells,
    locked: false,
    paraScale: 1,
    chooseBlendSpace: false,
  }
}

function example(animation: string, x: number, y: number, playbackScale = 1): BlendSpaceExample {
  return { animation, blendExample: '', playbackScale, params: [x, y, null, null] }
}

function paraGroup(patch: Partial<ParaGroupBlendSpace>): ParaGroupBlendSpace {
  return {
    kind: 'paragroup',
    dimensions: [],
    additionalExtraction: [],
    examples: [],
    pseudoExamples: [],
    faces: [],
    virtualGrid: null,
    jointList: [],
    threshold: null,
    rampZ: null,
    idleToMove: false,
    timewarpGroup: '',
    ...patch,
  }
}

// mc_broken_movement_blend.bspace: its VGrid has 121 corners for 11 x 12 cells, so the game builds the grid
const BROKEN = paraGroup({
  dimensions: [dimension('MoveSpeed', 0, 5, 11), dimension('TurnSpeed', -1.571, 1.571, 12)],
  examples: [
    example('mc_broken_ambient_walk_turn_l', 0, 1.571),
    example('mc_broken_combat_idle_76', 0, 0),
    example('mc_broken_ambient_walk_turn_r', 0, -1.571),
    example('mc_broken_ambient_walk_turn_l', 0.54, 1.571, 1.25),
    example('mc_broken_combat_walk_f', 0.54, 0, 1.25),
    example('mc_broken_ambient_walk_turn_r', 0.54, -1.571, 1.25),
    example('mc_broken_combat_run_f2', 4, 1.571),
    example('mc_broken_combat_run_f2', 4, 0),
    example('mc_broken_combat_run_f2', 4, -1.571),
    example('mc_broken_combat_run_f2', 5, 1.571, 1.25),
    example('mc_broken_combat_run_f2', 5, 0, 1.25),
    example('mc_broken_combat_run_f2', 5, -1.571, 1.25),
  ],
  faces: [
    [0, 4, 3],
    [0, 1, 4],
    [1, 5, 4],
    [1, 2, 5],
    [3, 7, 6],
    [3, 4, 7],
    [4, 8, 7],
    [4, 5, 8],
    [6, 10, 9],
    [6, 7, 10],
    [7, 11, 10],
    [7, 8, 11],
  ],
})
const BROKEN_DIMENSIONS = [
  prepared(BROKEN.dimensions[0], MotionParam.TravelSpeed),
  prepared(BROKEN.dimensions[1], MotionParam.TurnSpeed),
]

function round(values: ArrayLike<number>, digits = 4) {
  const scale = 10 ** digits
  return Array.from(values, (it) => Math.round(it * scale) / scale)
}

describe('weights2D', () => {
  it('interpolates the triangle that holds the point', () => {
    const out = new Float32Array(12)
    const face = weights2D(1.5, 0, blendParameters('broken', BROKEN), BROKEN.faces, out, new Float32Array(4))
    // on the edge from walk_f (0.54) to run_f2 (4): the first face that holds it
    expect(face).toBe(5)
    expect(round(out)).toEqual([0, 0, 0, 0, 0.7225, 0, 0, 0.2775, 0, 0, 0, 0])
  })

  it('weighs a quad and hands a pseudo example to its two examples', () => {
    const space = paraGroup({
      examples: [example('a', 0, 0), example('b', 1, 0), example('c', 1, 1), example('d', 0, 1)],
      pseudoExamples: [{ i0: 0, i1: 1, w0: 0.5, w1: 0.5 }],
      faces: [[0, 1, 2, 3]],
    })
    const out = new Float32Array(4)
    const parameters = blendParameters('quad', space)
    expect(weights2D(0.5, 0.5, parameters, space.faces, out, new Float32Array(4))).toBe(0)
    expect(round(out)).toEqual([0.25, 0.25, 0.25, 0.25])
    // the pseudo example sits between a and b
    expect(parameters[4]).toMatchObject({ x: 0.5, y: 0 })
    weights2D(0.5, 0, parameters, [[4, 2, 3]], out, new Float32Array(4))
    expect(round(out)).toEqual([0.5, 0.5, 0, 0])
  })

  it('extrapolates the last face outside every face', () => {
    const space = paraGroup({
      examples: [example('a', 0, 0), example('b', 1, 0), example('c', 0, 1)],
      faces: [[0, 1, 2]],
    })
    const out = new Float32Array(3)
    expect(weights2D(5, 5, blendParameters('far', space), space.faces, out, new Float32Array(4))).toBe(-1)
    expect(round(out)).toEqual([-9, 5, 5])
  })
})

describe('buildGridFromFaces', () => {
  it('builds the grid of the broken movement blend', () => {
    const grid = buildGridFromFaces('broken', BROKEN, BROKEN_DIMENSIONS)
    expect(grid.length).toBe(132)
    // (0, -1.571): walk_turn_r alone
    expect(grid[0].indices[0]).toBe(2)
    expect(grid[0].weights[0]).toBeCloseTo(1)
    // (1.5, -1.571): between walk_turn_r at 0.54 and run_f2 at 4
    expect(grid[3].indices.slice(0, 2)).toEqual([5, 8])
    expect(round(grid[3].weights.slice(0, 2))).toEqual([0.7225, 0.2775])
    // (5, 1.571): the last corner
    expect(grid[131].indices[0]).toBe(9)
    expect(grid[131].weights[0]).toBeCloseTo(1)
  })

  it('refuses examples without positions and 3D blend spaces', () => {
    const noPositions = paraGroup({ examples: [{ ...example('a', 0, 0), params: [0, null, null, null] }] })
    expect(() => buildGridFromFaces('x', noPositions, BROKEN_DIMENSIONS)).toThrow(/root motion/)
    const third = prepared(dimension('TravelSlope', 0, 1, 3), MotionParam.TravelSlope)
    expect(() => buildGridFromFaces('x', BROKEN, [...BROKEN_DIMENSIONS, third])).toThrow(/3D/)
  })
})

describe('buildGridFromNearest', () => {
  it('puts the nearest example on each corner', () => {
    const grid = buildGridFromNearest('broken', BROKEN, BROKEN_DIMENSIONS)
    expect(grid.length).toBe(132)
    expect(grid[0]).toEqual({ indices: [2, 0, 0, 0], weights: [1, 0, 0, 0] })
    // (1.5, -1.571): walk_turn_r at 0.54 is nearer than run_f2 at 4
    expect(grid[3].indices[0]).toBe(5)
    // (4, -1.571): run_f2
    expect(grid[8].indices[0]).toBe(8)
    expect(grid[131].indices[0]).toBe(9)
  })

  it('refuses examples without positions', () => {
    const noPositions = paraGroup({ examples: [{ ...example('a', 0, 0), params: [0, null, null, null] }] })
    expect(() => buildGridFromNearest('x', noPositions, BROKEN_DIMENSIONS)).toThrow(/root motion/)
  })
})
