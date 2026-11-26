import { describe, expect, it } from 'vitest'
import type { BlendSpaceDimension, BlendSpaceExample, ParaGroupBlendSpace } from '../../formats/bspace'
import {
  BlendSpaceScratch,
  blendSpaceWeights,
  dimensionRange,
  MotionParam,
  normalizeWeights,
  prepareCombined,
  prepareParaGroup,
  weights1D,
  type PreparedBlendSpace,
} from './blendSpace'

function dimension(name: string, min: number, max: number, cells: number, extra?: Partial<BlendSpaceDimension>) {
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
    ...extra,
  } satisfies BlendSpaceDimension
}

function example(animation: string, params: Array<number | null> = [], playbackScale = 1): BlendSpaceExample {
  return { animation, blendExample: '', playbackScale, params: [...params, null, null, null, null].slice(0, 4) }
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

function weightsAt(space: PreparedBlendSpace, ...params: number[]) {
  const out = new Float32Array(space.slots.length)
  blendSpaceWeights(space, params, out, new BlendSpaceScratch(space))
  return round(out, 4)
}

function round(values: ArrayLike<number>, digits: number) {
  const scale = 10 ** digits
  return Array.from(values, (it) => Math.round(it * scale) / scale)
}

// naga_turn_blend_r.bspace: a 1D blend space without VGrid
const NAGA_TURN = paraGroup({
  dimensions: [dimension('DesiredFacing', -3.14, 0, 27, { locked: true })],
  examples: [
    example('Corrupted_Naga_180_R', [-3.15]),
    example('Corrupted_Naga_90_R', [-1.575]),
    example('Corrupted_Naga_Idle', [0]),
  ],
  faces: [
    [0, 1],
    [1, 2],
  ],
})

/**
 * A 2D grid of 3 x 3 cells whose corner `c` holds example `c` alone
 */
function grid2D() {
  return paraGroup({
    dimensions: [dimension('MoveSpeed', 0, 2, 3), dimension('TurnSpeed', -1, 1, 3)],
    examples: Array.from({ length: 9 }, (_, i) => example(`clip_${i}`)),
    virtualGrid: Array.from({ length: 9 }, (_, i) => ({ indices: [i, 0, 0, 0], weights: [1, 0, 0, 0] })),
  })
}

describe('weights1D', () => {
  it('interpolates the line whose span holds the point', () => {
    const out = new Float32Array(3)
    weights1D(-0.7875, [-3.15, -1.575, 0], NAGA_TURN.faces, out)
    expect(Array.from(out)).toEqual([0, 0.5, 0.5])
  })

  it('extrapolates the closest line', () => {
    const out = new Float32Array(3)
    weights1D(0.7875, [-3.15, -1.575, 0], NAGA_TURN.faces, out)
    expect(Array.from(out)).toEqual([0, -0.5, 1.5])
  })
})

describe('prepareParaGroup', () => {
  it('builds the grid of a 1D blend space from SetPara0', () => {
    const space = prepareParaGroup('naga', NAGA_TURN)
    expect(space.dimensions[0]).toMatchObject({ param: MotionParam.DesiredFacing, locked: true })
    expect(space.lanes).toBe(2)
    expect(space.gridIndices.length).toBe(27 * 2)
    // the last cell is at 0: the idle alone
    expect(space.gridIndices[26 * 2]).toBe(2)
    expect(space.gridWeights[26 * 2]).toBeCloseTo(1)
  })

  it('keeps an authored grid', () => {
    const space = prepareParaGroup('grid', grid2D())
    expect(space.lanes).toBe(4)
    expect(Array.from(space.gridIndices.subarray(4 * 4, 4 * 4 + 4))).toEqual([4, 0, 0, 0])
  })

  it('refuses a 2D blend space without grid and example positions, and unknown parameters', () => {
    expect(() => prepareParaGroup('x', { ...grid2D(), virtualGrid: null })).toThrow(/no grid/)
    expect(() => prepareParaGroup('x', paraGroup({ dimensions: [dimension('Wobble', 0, 1, 3)] }))).toThrow(
      /unknown motion parameter/,
    )
  })
})

describe('blendSpaceWeights', () => {
  it('blends a 1D grid linearly between two cells', () => {
    const space = prepareParaGroup('naga', NAGA_TURN)
    // the grid cells lie between the examples: near an example the weights are close, not exact
    expect(round(weightsAt(space, -0.7875), 2)).toEqual([0, 0.5, 0.5])
    expect(round(weightsAt(space, -1.575), 2)).toEqual([0, 0.99, 0])
    // the last corner holds the idle alone, the neighbor's share drops below 0.0001
    expect(weightsAt(space, 0)).toEqual([0, 0, 1])
    // clamped to the range, a missing value takes the minimum
    expect(weightsAt(space, 5)).toEqual([0, 0, 1])
    expect(weightsAt(space, NaN)).toEqual(weightsAt(space, -3.14))
  })

  it('merges 1D slots that play the same animation', () => {
    const space = prepareParaGroup(
      'merge',
      paraGroup({
        dimensions: [dimension('MoveSpeed', 0, 2, 3)],
        examples: [example('walk', [0]), example('run', [1]), example('walk', [2])],
        faces: [
          [0, 1],
          [1, 2],
        ],
      }),
    )
    expect(weightsAt(space, 1.5)).toEqual([0.5, 0.5, 0])
  })

  it('blends a 2D grid bilinearly', () => {
    const space = prepareParaGroup('grid', grid2D())
    expect(weightsAt(space, 0.5, -0.5)).toEqual([0.25, 0.25, 0, 0.25, 0.25, 0, 0, 0, 0])
    // kept 0.001 short of the last cell: the corner diagonal to the last drops out
    expect(weightsAt(space, 2, 1)).toEqual([0, 0, 0, 0, 0, 0.001, 0, 0.001, 0.998])
  })

  it('fades the third parameter by RAMPZ without THRESHOLD', () => {
    const base = paraGroup({
      dimensions: [dimension('MoveSpeed', 0, 1, 3), dimension('TurnSpeed', 0, 1, 3), dimension('TravelSlope', 0, 1, 3)],
      examples: [example('flat'), example('slope')],
      // z = 0 corners hold `flat`, the others `slope`
      virtualGrid: Array.from({ length: 27 }, (_, i) => ({
        indices: [i < 9 ? 0 : 1, 0, 0, 0, 0, 0, 0, 0],
        weights: [1, 0, 0, 0, 0, 0, 0, 0],
      })),
    })
    expect(weightsAt(prepareParaGroup('plain', base), 0, 0, 1)).toEqual([0, 1])
    // the default threshold is far below any |y|: the slope fades out completely
    expect(weightsAt(prepareParaGroup('ramp', { ...base, rampZ: 2 }), 0, 0, 1)).toEqual([1, 0])
  })

  it('chooses the member of a combined blend space whose range is closest', () => {
    const left = prepareParaGroup(
      'left',
      paraGroup({
        dimensions: [dimension('DesiredFacing', -3, 0, 3)],
        examples: [example('turn_l', [-3]), example('idle', [0])],
        faces: [[0, 1]],
      }),
    )
    const right = prepareParaGroup(
      'right',
      paraGroup({
        dimensions: [dimension('DesiredFacing', 0, 3, 3)],
        examples: [example('idle', [0]), example('turn_r', [3])],
        faces: [[0, 1]],
      }),
    )
    const comb = prepareCombined(
      'comb',
      {
        kind: 'combined',
        dimensions: [dimension('DesiredFacing', 0, 0, 3, { paraScale: 1, chooseBlendSpace: true })],
        additionalExtraction: [],
        blendSpaces: ['left', 'right'],
        jointList: [],
      },
      [left, right],
    )
    // the idle of both members shares one slot
    expect(comb.slots.map((it) => it.animation)).toEqual(['turn_l', 'idle', 'turn_r'])
    expect(weightsAt(comb, 1.5)).toEqual([0, 0.5, 0.5])
    expect(weightsAt(comb, -1.5)).toEqual([0.5, 0.5, 0])
    expect(dimensionRange(comb, 0)).toEqual([-3, 3])
  })
})

describe('normalizeWeights', () => {
  it('drops tiny weights and scales the rest to one', () => {
    const weights = new Float32Array([0.00005, 1, 3])
    normalizeWeights(weights, 3)
    expect(Array.from(weights)).toEqual([0, 0.25, 0.75])
  })

  it('gives the first slot everything when nothing is left', () => {
    const weights = new Float32Array([0, 0.00001])
    normalizeWeights(weights, 2)
    expect(Array.from(weights)).toEqual([1, 0])
  })
})
