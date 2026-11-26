import type { BlendSpace, BlendSpaceDimension, CombinedBlendSpace, ParaGroupBlendSpace } from '../../formats/bspace'
import { buildGridFromFaces } from './blendSpaceFaces'
import { buildGridFromNearest } from './blendSpaceNearest'

/**
 * How a 2D or 3D blend space without a usable `VGrid` builds its grid:
 * - `faces`: the game's rule, the face weights at each corner (2D only, 3D throws), see {@link buildGridFromFaces}
 * - `nearest`: a fallback, the nearest example at each corner, see {@link buildGridFromNearest}
 */
const GRID_BUILDERS = {
  faces: buildGridFromFaces,
  nearest: buildGridFromNearest,
}
const GRID_BUILDER: keyof typeof GRID_BUILDERS = 'faces'

/**
 * The motion parameters of CryAnimation (`EMotionParamID`), the index into {@link CharacterMotion.params}
 */
export const MotionParam = {
  TravelSpeed: 0,
  TurnSpeed: 1,
  TravelAngle: 2,
  TravelSlope: 3,
  TurnAngle: 4,
  TravelDist: 5,
  StopLeg: 6,
  BlendWeight: 7,
  BlendWeight2: 8,
  BlendWeight3: 9,
  BlendWeight4: 10,
  AimHorzNavSpeed: 11,
  AimHorzNavAngle: 12,
  DesiredFacing: 13,
  VelocityX: 14,
  VelocityY: 15,
  SlopeYaw: 16,
  SlopePitch: 17,
} as const

export const MOTION_PARAM_COUNT = 18

/**
 * The parameter a dimension `name` selects, with case . `MoveSpeed` is the travel speed.
 */
const DIMENSION_PARAMS: Record<string, number> = {
  MoveSpeed: MotionParam.TravelSpeed,
  TurnSpeed: MotionParam.TurnSpeed,
  TravelSlope: MotionParam.TravelSlope,
  TravelAngle: MotionParam.TravelAngle,
  TravelDist: MotionParam.TravelDist,
  TurnAngle: MotionParam.TurnAngle,
  BlendWeight: MotionParam.BlendWeight,
  VelocityX: MotionParam.VelocityX,
  VelocityY: MotionParam.VelocityY,
  SlopeYaw: MotionParam.SlopeYaw,
  SlopePitch: MotionParam.SlopePitch,
  BlendWeight2: MotionParam.BlendWeight2,
  BlendWeight3: MotionParam.BlendWeight3,
  BlendWeight4: MotionParam.BlendWeight4,
  AimHorzNavSpeed: MotionParam.AimHorzNavSpeed,
  AimHorzNavAngle: MotionParam.AimHorzNavAngle,
  DesiredFacing: MotionParam.DesiredFacing,
  StopLeg: MotionParam.StopLeg,
}

/**
 * `ChooseBlendSpace` compares these as angles (`0x2014`)
 */
const ANGULAR_PARAMS = (1 << MotionParam.TravelAngle) | (1 << MotionParam.TurnAngle) | (1 << MotionParam.DesiredFacing)

/**
 * Weights below drop out
 */
const MIN_WEIGHT = 0.0001
/**
 * A position is kept this far short of the last grid cell
 */
const CELL_MARGIN = 0.001
/**
 * `GetWeights1D` extrapolates the closest line within this distance
 */
const FARTHEST_LINE = 9999
/**
 * The defaults of `THRESHOLD tz` and `RAMPZ tx` when not authored
 */
const NO_THRESHOLD = -99999

export interface PreparedDimension {
  name: string
  /**
   * {@link MotionParam}
   */
  param: number
  min: number
  max: number
  cells: number
  /**
   * The dimension keeps the value it had when the entry started
   */
  locked: boolean
  /**
   * Combined: the factor of the parameter for the members
   */
  paraScale: number
  chooseBlendSpace: boolean
}

/**
 * An animation a blend space plays and its playback scale
 */
export interface BlendSpaceSlot {
  animation: string
  playbackScale: number
}

/**
 * A `ParaGroup` ready to blend: its examples and the grid of example weights at the cell corners
 */
export interface PreparedParaGroup {
  kind: 'paragroup'
  file: string
  dimensions: PreparedDimension[]
  /**
   * One per example
   */
  slots: BlendSpaceSlot[]
  /**
   * Per slot, the first slot that plays the same animation at the same playback scale (the slot itself when none)
   */
  sharedSlots: Int16Array
  /**
   * Examples per grid corner: 2, 4 or 8 for 1, 2 or 3 dimensions
   */
  lanes: number
  /**
   * Per corner (x fastest) and lane: the example index and its weight
   */
  gridIndices: Uint16Array
  gridWeights: Float32Array
  threshold: number
  rampZ: number
}

/**
 * A `CombinedBlendSpace` ready to blend: its members, whose examples share a slot when they play the same animation at
 * the same playback scale
 */
export interface PreparedCombined {
  kind: 'combined'
  file: string
  dimensions: PreparedDimension[]
  slots: BlendSpaceSlot[]
  members: PreparedParaGroup[]
  /**
   * Per member, the slot of each of its examples
   */
  memberSlots: Uint16Array[]
}

export type PreparedBlendSpace = PreparedParaGroup | PreparedCombined

/**
 * A corner of a blend space grid: one example index and weight per lane
 */
export interface BlendSpaceGridCorner {
  indices: number[]
  weights: number[]
}

/**
 * Prepares a blend space for sampling, as the game's preparation as far as the data needs it
 *
 * @remarks
 * A `ParaGroup` keeps its authored grid (`VGrid`, 831 of 850 files). Without one, a 1D blend space builds it from the
 * authored example positions (`SetPara0`) with `GetWeights1D`, a 2D or 3D one with {@link GRID_BUILDER}. The
 * extraction of example positions from root motion is not ported: such a blend space throws.
 *
 * @param member - loads and prepares a member `.bspace` of a `.comb`
 */
export async function prepareBlendSpace(
  file: string,
  space: BlendSpace,
  member: (file: string) => Promise<PreparedBlendSpace>,
): Promise<PreparedBlendSpace> {
  if (space.kind === 'paragroup') {
    return prepareParaGroup(file, space)
  }
  return prepareCombined(file, space, await Promise.all(space.blendSpaces.map(member)))
}

export function prepareParaGroup(file: string, space: ParaGroupBlendSpace): PreparedParaGroup {
  const dimensions = prepareDimensions(file, space.dimensions)
  if (dimensions.length < 1 || dimensions.length > 3) {
    throw new Error(`${file}: ${dimensions.length} dimensions`)
  }
  for (const example of space.examples) {
    if (!example.animation) {
      throw new Error(`${file}: nested blend spaces are not supported`)
    }
  }
  const lanes = 1 << dimensions.length
  const grid = space.virtualGrid ?? buildGrid(file, space, dimensions)
  const gridIndices = new Uint16Array(grid.length * lanes)
  const gridWeights = new Float32Array(grid.length * lanes)
  const lastExample = Math.max(0, space.examples.length - 1)
  for (let cell = 0; cell < grid.length; cell++) {
    const corner = grid[cell]
    for (let lane = 0; lane < lanes; lane++) {
      gridIndices[cell * lanes + lane] = Math.min(corner.indices[lane] ?? 0, lastExample)
      gridWeights[cell * lanes + lane] = corner.weights[lane] ?? 0
    }
  }
  const slots = space.examples.map((it) => ({ animation: it.animation, playbackScale: it.playbackScale }))
  return {
    kind: 'paragroup',
    file,
    dimensions,
    slots,
    sharedSlots: sharedSlots(slots),
    lanes,
    gridIndices,
    gridWeights,
    threshold: space.threshold ?? NO_THRESHOLD,
    rampZ: space.rampZ ?? 0,
  }
}

export function prepareCombined(
  file: string,
  space: CombinedBlendSpace,
  members: PreparedBlendSpace[],
): PreparedCombined {
  const slots: BlendSpaceSlot[] = []
  const memberSlots = members.map((member) => {
    if (member.kind !== 'paragroup') {
      throw new Error(`${file}: a member is a combined blend space (${member.file})`)
    }
    return Uint16Array.from(member.slots, (slot) => {
      let index = slots.findIndex(
        (it) => sameAnimation(it.animation, slot.animation) && it.playbackScale === slot.playbackScale,
      )
      if (index < 0) {
        index = slots.length
        slots.push(slot)
      }
      return index
    })
  })
  return {
    kind: 'combined',
    file,
    dimensions: prepareDimensions(file, space.dimensions),
    slots,
    members: members as PreparedParaGroup[],
    memberSlots,
  }
}

function prepareDimensions(file: string, dimensions: BlendSpaceDimension[]): PreparedDimension[] {
  return dimensions.map((it) => {
    const param = DIMENSION_PARAMS[it.name]
    if (param == null) {
      throw new Error(`${file}: unknown motion parameter ${it.name}`)
    }
    return {
      name: it.name,
      param,
      min: it.min,
      max: it.max,
      cells: it.cells,
      locked: it.locked,
      paraScale: it.paraScale ?? 1,
      chooseBlendSpace: it.chooseBlendSpace,
    }
  })
}

function buildGrid(file: string, space: ParaGroupBlendSpace, dimensions: PreparedDimension[]) {
  if (dimensions.length === 1) {
    return buildGrid1D(file, space, dimensions)
  }
  return GRID_BUILDERS[GRID_BUILDER](file, space, dimensions)
}

/**
 * The grid of a 1D blend space without one: `GetWeights1D` at each cell, at most two examples
 * per corner
 */
function buildGrid1D(
  file: string,
  space: ParaGroupBlendSpace,
  dimensions: PreparedDimension[],
): BlendSpaceGridCorner[] {
  const positions = space.examples.map((it) => it.params[0])
  if (positions.some((it) => it == null)) {
    throw new Error(`${file}: no grid and an example without SetPara0 (root motion extraction is not ported)`)
  }
  const { min, max, cells } = dimensions[0]
  const step = (max - min) / (cells - 1)
  const weights = new Float32Array(space.examples.length)
  const grid: BlendSpaceGridCorner[] = []
  for (let cell = 0; cell < cells; cell++) {
    weights1D(cell * step + min, positions as number[], space.faces, weights)
    const corner = { indices: [0, 0], weights: [0, 0] }
    let used = 0
    for (let example = 0; example < weights.length; example++) {
      if (weights[example] === 0) {
        continue
      }
      if (used === 2) {
        throw new Error(`${file}: Invalid Weights`)
      }
      corner.indices[used] = example
      corner.weights[used] = weights[example]
      used++
    }
    grid.push(corner)
  }
  return grid
}

/**
 * `GetWeights1D`: interpolates the first line whose span holds the point, else extrapolates the
 * line whose span lies closest
 */
export function weights1D(desired: number, positions: number[], faces: number[][], out: Float32Array) {
  out.fill(0)
  const lines = faces.filter((it) => it.length === 2)
  for (const [first, second] of lines) {
    const x0 = positions[first]
    const x1 = positions[second]
    if (x0 <= desired && desired <= x1) {
      const t = (desired - x0) / (x1 - x0)
      out[first] += 1 - t
      out[second] += t
      return
    }
  }
  let closest = FARTHEST_LINE
  let line: number[] | null = null
  for (const it of lines) {
    const t = (desired - positions[it[0]]) / (positions[it[1]] - positions[it[0]])
    let distance = 0
    if (t < 0) {
      distance = -t
    } else if (t > 1) {
      distance = t - 1
    } else {
      continue
    }
    if (distance < closest) {
      closest = distance
      line = it
    }
  }
  if (line) {
    const t = (desired - positions[line[0]]) / (positions[line[1]] - positions[line[0]])
    out[line[0]] += 1 - t
    out[line[1]] += t
  }
}

/**
 * Scratch arrays of {@link blendSpaceWeights}, sized for a blend space, created once per playing entry
 */
export class BlendSpaceScratch {
  /**
   * Weight per example of a ParaGroup
   */
  public readonly examples: Float32Array
  /**
   * Weight per slot of a member
   */
  public readonly member: Float32Array
  /**
   * Parameters of a member
   */
  public readonly memberParams = new Float32Array(4)

  public constructor(space: PreparedBlendSpace) {
    let most = space.slots.length
    if (space.kind === 'combined') {
      for (const member of space.members) {
        most = Math.max(most, member.slots.length)
      }
    }
    this.examples = new Float32Array(most)
    this.member = new Float32Array(most)
  }
}

/**
 * The weight of each slot of a blend space at the parameters, normalized (the game's `Parameterizer` weights)
 *
 * @param params - the value per dimension of the blend space
 * @param out - per slot
 */
export function blendSpaceWeights(
  space: PreparedBlendSpace,
  params: ArrayLike<number>,
  out: Float32Array,
  scratch: BlendSpaceScratch,
) {
  if (space.kind === 'paragroup') {
    paraGroupWeights(space, params, out, scratch.examples)
  } else {
    combinedWeights(space, params, out, scratch)
  }
  normalizeWeights(out, space.slots.length)
}

/**
 * Drops weights below 0.0001 and scales the rest to sum to one, the first taking all when none is left
 */
export function normalizeWeights(weights: Float32Array, count: number) {
  let sum = 0
  for (let i = 0; i < count; i++) {
    if (Math.abs(weights[i]) < MIN_WEIGHT) {
      weights[i] = 0
    }
    sum += weights[i]
  }
  if (count === 0) {
    return
  }
  if (sum === 0) {
    weights[0] = 1
    sum = 1
  }
  const scale = 1 / sum
  for (let i = 0; i < count; i++) {
    weights[i] *= scale
  }
}

/**
 * `BlendSpace1D` / `2D` / `3D`: the grid corners around the clamped
 * parameters, linear, bilinear or trilinear
 */
function paraGroupWeights(
  space: PreparedParaGroup,
  params: ArrayLike<number>,
  out: Float32Array,
  examples: Float32Array,
) {
  const dims = space.dimensions
  const count = space.slots.length
  examples.fill(0, 0, count)
  const x = clamped(dims[0], params[0])
  const cellsX = dims[0].cells
  const ix = gridCell(dims[0], x)
  const px = cellFraction
  if (dims.length === 1) {
    addCorner(space, ix, 1 - px, examples)
    addCorner(space, ix + 1, px, examples)
    for (let i = 0; i < count; i++) {
      out[i] = examples[i]
    }
    mergeSharedSlots(space.sharedSlots, out)
    normalizeWeights(out, count)
    return
  }
  const y = clamped(dims[1], params[1])
  const iy = gridCell(dims[1], y)
  const py = cellFraction
  if (dims.length === 2) {
    const row = cellsX * iy + ix
    const next = cellsX * (iy + 1) + ix
    addCorner(space, row, (1 - px) * (1 - py), examples)
    addCorner(space, row + 1, (1 - py) * px, examples)
    addCorner(space, next, (1 - px) * py, examples)
    addCorner(space, next + 1, py * px, examples)
  } else {
    let z = clamped(dims[2], params[2])
    const threshold = space.threshold
    const ramp = space.rampZ
    if ((-100 < threshold && threshold < 100) || 0 < ramp) {
      if (Math.abs(y) <= threshold) {
        const across = 1 - Math.abs(y) / threshold
        const along = Math.abs(x) < ramp ? Math.abs(x) / ramp : 1
        z *= along <= across ? along : across
      } else {
        z = 0
      }
    }
    const iz = gridCell(dims[2], z)
    const pz = cellFraction
    const cellsY = dims[1].cells
    const c00 = (cellsY * iz + iy) * cellsX + ix
    const c10 = (cellsY * iz + iy + 1) * cellsX + ix
    const c01 = (cellsY * (iz + 1) + iy) * cellsX + ix
    const c11 = (cellsY * (iz + 1) + iy + 1) * cellsX + ix
    addCorner(space, c00, (1 - pz) * (1 - px) * (1 - py), examples)
    addCorner(space, c00 + 1, (1 - pz) * px * (1 - py), examples)
    addCorner(space, c10, (1 - pz) * (1 - px) * py, examples)
    addCorner(space, c10 + 1, (1 - pz) * px * py, examples)
    addCorner(space, c01, pz * (1 - px) * (1 - py), examples)
    addCorner(space, c01 + 1, pz * px * (1 - py), examples)
    addCorner(space, c11, pz * (1 - px) * py, examples)
    addCorner(space, c11 + 1, pz * px * py, examples)
  }
  for (let i = 0; i < count; i++) {
    out[i] = examples[i]
  }
}

function addCorner(space: PreparedParaGroup, cell: number, share: number, examples: Float32Array) {
  const lanes = space.lanes
  const first = cell * lanes
  if (first < 0 || first + lanes > space.gridIndices.length) {
    return
  }
  for (let lane = 0; lane < lanes; lane++) {
    examples[space.gridIndices[first + lane]] += space.gridWeights[first + lane] * share
  }
}

/**
 * Per slot, the first slot that plays the same animation at the same playback scale
 */
function sharedSlots(slots: BlendSpaceSlot[]): Int16Array {
  const result = new Int16Array(slots.length)
  for (let i = 0; i < slots.length; i++) {
    result[i] = i
    for (let first = 0; first < i; first++) {
      if (
        sameAnimation(slots[first].animation, slots[i].animation) &&
        slots[first].playbackScale === slots[i].playbackScale
      ) {
        result[i] = first
        break
      }
    }
  }
  return result
}

/**
 * Moves the weight of each slot that plays the animation of an earlier slot onto that slot (the 1D blend)
 */
function mergeSharedSlots(shared: Int16Array, weights: Float32Array) {
  for (let i = 1; i < shared.length; i++) {
    const first = shared[i]
    if (first !== i) {
      weights[first] += weights[i]
      weights[i] = 0
    }
  }
}

/**
 * `CombinedBlendSpaces`: each chosen member blends at the parameters its dimensions read, scaled
 * by `ParaScale`, and adds its weights to the shared slots
 */
function combinedWeights(
  space: PreparedCombined,
  params: ArrayLike<number>,
  out: Float32Array,
  scratch: BlendSpaceScratch,
) {
  out.fill(0, 0, space.slots.length)
  const viable = chosenMembers(space, params)
  for (let m = 0; m < space.members.length; m++) {
    if (m >= 32 || !(viable & (1 << m))) {
      continue
    }
    const member = space.members[m]
    const memberParams = scratch.memberParams
    memberParams.fill(0)
    for (let d = 0; d < member.dimensions.length; d++) {
      for (let outer = 0; outer < space.dimensions.length; outer++) {
        if (member.dimensions[d].param === space.dimensions[outer].param) {
          memberParams[d] = params[outer] * space.dimensions[outer].paraScale
          break
        }
      }
    }
    paraGroupWeights(member, memberParams, scratch.member, scratch.examples)
    const slots = space.memberSlots[m]
    for (let i = 0; i < slots.length; i++) {
      out[slots[i]] += scratch.member[i]
    }
  }
}

/**
 * The members that blend, one bit each: all, less those a `ChooseBlendSpace` dimension rules out by keeping the member
 * whose range lies closest to the parameter (angles wrapped into [-π, π], the first of equals wins)
 */
function chosenMembers(space: PreparedCombined, params: ArrayLike<number>): number {
  let viable = -1
  for (let d = 0; d < space.dimensions.length; d++) {
    const dimension = space.dimensions[d]
    if (!dimension.chooseBlendSpace) {
      continue
    }
    const value = params[d]
    const angular = !!(ANGULAR_PARAMS & (1 << dimension.param))
    let best = Number.MAX_VALUE
    let closest = 0
    for (let m = 0; m < space.members.length && m < 32; m++) {
      for (const it of space.members[m].dimensions) {
        if (best <= 0) {
          break
        }
        if (it.param !== dimension.param) {
          continue
        }
        let below = it.min - value
        let above = value - it.max
        if (angular) {
          below = wrapAngle(below)
          above = wrapAngle(above)
        }
        const distance = above <= below ? below : above
        if (distance < best) {
          best = distance
          closest = 1 << m
        }
      }
    }
    viable &= closest
  }
  return viable
}

/**
 * `AngleWrap_PI`
 */
function wrapAngle(angle: number) {
  if (angle < -Math.PI) {
    return angle + 2 * Math.PI
  }
  if (Math.PI < angle) {
    return angle - 2 * Math.PI
  }
  return angle
}

/**
 * The parameter clamped to the dimension: its minimum when below or not a number, its maximum at or above
 */
function clamped(dimension: PreparedDimension, value: number) {
  if (dimension.min <= value) {
    return dimension.max <= value ? dimension.max : value
  }
  return dimension.min
}

/**
 * How far through its cell the last {@link gridCell} value lies (no tuple per call)
 */
let cellFraction = 0

/**
 * The grid cell the value falls in, kept 0.001 short of the last cell; how far through it goes to {@link cellFraction}
 */
function gridCell(dimension: PreparedDimension, value: number): number {
  const last = dimension.cells - 1
  let position = ((value - dimension.min) * last) / (dimension.max - dimension.min)
  if (0 <= position) {
    position = Math.min(position, last - CELL_MARGIN)
  } else {
    position = 0
  }
  const cell = Math.trunc(position)
  cellFraction = position - cell
  return cell
}

function sameAnimation(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * The range a parameter has in a blend space: its dimension's, or for a combined dimension without a range (e.g.
 * `DesiredFacing` with `ChooseBlendSpace`) the union of the members' ranges
 */
export function dimensionRange(space: PreparedBlendSpace, dimension: number): [number, number] {
  const it = space.dimensions[dimension]
  if (it.min < it.max || space.kind !== 'combined') {
    return [it.min, it.max]
  }
  let min = Infinity
  let max = -Infinity
  for (const member of space.members) {
    for (const d of member.dimensions) {
      if (d.param === it.param) {
        min = Math.min(min, d.min)
        max = Math.max(max, d.max)
      }
    }
  }
  return Number.isFinite(min) ? [min, max] : [it.min, it.max]
}
