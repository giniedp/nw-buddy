import type { ParaGroupBlendSpace } from '../../formats/bspace'
import type { BlendSpaceGridCorner, PreparedDimension } from './blendSpace'

/**
 * The widening of the hull test per pass of `GetWeights2D`, and where the passes stop
 */
const HULL_STEP = 0.05
const HULL_LIMIT = 2.35
/**
 * The weight `GetConvex4` gives the points of a face that is neither a triangle nor a quad: never inside
 */
const UNSET_WEIGHT = 9999

/**
 * A point a face can name: a real example (its weight goes to itself) or a pseudo example (its weight is split between
 * two examples)
 */
export interface BlendParameter {
  x: number
  y: number
  i0: number
  w0: number
  i1: number
  w1: number
}

/**
 * The grid of a 2D blend space without a usable `VGrid`: `GetWeights2D` at each
 * cell corner, x fastest, at most four examples per corner
 */
export function buildGridFromFaces(
  file: string,
  space: ParaGroupBlendSpace,
  dimensions: PreparedDimension[],
): BlendSpaceGridCorner[] {
  if (dimensions.length !== 2) {
    throw new Error(`${file}: no grid (the face weights of ${dimensions.length}D blend spaces are not ported)`)
  }
  const parameters = blendParameters(file, space)
  const [dx, dy] = dimensions
  const stepX = (dx.max - dx.min) / (dx.cells - 1)
  const stepY = (dy.max - dy.min) / (dy.cells - 1)
  const weights = new Float32Array(space.examples.length)
  const bary = new Float32Array(4)
  const grid: BlendSpaceGridCorner[] = []
  for (let cy = 0; cy < dy.cells; cy++) {
    for (let cx = 0; cx < dx.cells; cx++) {
      weights2D(dx.min + cx * stepX, dy.min + cy * stepY, parameters, space.faces, weights, bary)
      const corner = { indices: [0, 0, 0, 0], weights: [0, 0, 0, 0] }
      let used = 0
      for (let example = 0; example < weights.length; example++) {
        if (weights[example] === 0) {
          continue
        }
        if (used === 4) {
          throw new Error(`${file}: Invalid Weights`)
        }
        corner.indices[used] = example
        corner.weights[used] = weights[example]
        used++
      }
      grid.push(corner)
    }
  }
  return grid
}

/**
 * The examples then the pseudo examples, at their authored positions (`SetPara0`, `SetPara1`). A pseudo example takes
 * the blend of its two examples' positions.
 */
export function blendParameters(file: string, space: ParaGroupBlendSpace): BlendParameter[] {
  const result: BlendParameter[] = space.examples.map((it, index) => {
    const x = it.params[0]
    const y = it.params[1]
    if (x == null || y == null) {
      throw new Error(`${file}: no grid and an example without SetPara0/1 (root motion extraction is not ported)`)
    }
    return { x, y, i0: index, w0: 1, i1: index, w1: 0 }
  })
  for (const pseudo of space.pseudoExamples) {
    const p0 = result[pseudo.i0]
    const p1 = result[pseudo.i1]
    if (!p0 || !p1) {
      throw new Error(`${file}: a pseudo example blends a missing example`)
    }
    result.push({
      x: p0.x * pseudo.w0 + p1.x * pseudo.w1,
      y: p0.y * pseudo.w0 + p1.y * pseudo.w1,
      i0: pseudo.i0,
      w0: pseudo.w0,
      i1: pseudo.i1,
      w1: pseudo.w1,
    })
  }
  return result
}

/**
 * `GetWeights2D`: each pass tries the faces in order and takes the first whose weights all lie in
 * `[-d, 1 + d]`, `d` growing by 0.05 a pass up to 2.35. Outside every face the weights of the last face tried stay
 * (extrapolated).
 *
 * @param out - per example
 * @param bary - scratch, four entries
 * @returns the face, -1 outside every face
 */
export function weights2D(
  x: number,
  y: number,
  parameters: BlendParameter[],
  faces: number[][],
  out: Float32Array,
  bary: Float32Array,
): number {
  out.fill(0)
  for (let spread = 0; spread < HULL_LIMIT; spread += HULL_STEP) {
    for (let face = 0; face < faces.length; face++) {
      const points = faces[face]
      convex4(x, y, parameters, points, out, bary)
      let inside = true
      for (let point = 0; point < points.length; point++) {
        if (bary[point] < -spread || bary[point] > 1 + spread) {
          inside = false
          break
        }
      }
      if (inside) {
        return face
      }
    }
  }
  return -1
}

/**
 * `GetConvex4`: the weights of a triangle's or a quad's points at the point, added to the examples
 * after clearing them
 */
function convex4(
  x: number,
  y: number,
  parameters: BlendParameter[],
  points: number[],
  out: Float32Array,
  bary: Float32Array,
) {
  out.fill(0)
  if (points.length === 3) {
    triangle(x, y, parameters[points[0]], parameters[points[1]], parameters[points[2]], bary)
  } else if (points.length === 4) {
    extrapolate4(x, y, parameters[points[0]], parameters[points[1]], parameters[points[2]], parameters[points[3]], bary)
  } else {
    bary.fill(UNSET_WEIGHT)
    return
  }
  for (let point = 0; point < points.length; point++) {
    const parameter = parameters[points[point]]
    out[parameter.i0] += parameter.w0 * bary[point]
    out[parameter.i1] += parameter.w1 * bary[point]
  }
}

/**
 * Barycentric weights of a triangle, unscaled when it is degenerate
 */
function triangle(x: number, y: number, v0: BlendParameter, v1: BlendParameter, v2: BlendParameter, out: Float32Array) {
  const px = x - v2.x
  const py = y - v2.y
  const z0x = v0.x - v2.x
  const z0y = v0.y - v2.y
  const z1x = v1.x - v2.x
  const z1y = v1.y - v2.y
  const u = px * z1y - py * z1x
  const v = py * z0x - px * z0y
  const w = z0x * z1y - z1x * z0y - u - v
  const sum = u + v + w
  const scale = Math.abs(sum) > Number.EPSILON ? 1 / sum : 1
  out[0] = u * scale
  out[1] = v * scale
  out[2] = w * scale
  out[3] = 0
}

/**
 * `ComputeWeightExtrapolate4`: the sum of the weights of the four triangles the diagonals cut,
 * each counted only on the inner side of its outer edge, scaled to sum to one
 */
function extrapolate4(
  x: number,
  y: number,
  p0: BlendParameter,
  p1: BlendParameter,
  p2: BlendParameter,
  p3: BlendParameter,
  out: Float32Array,
) {
  out.fill(0)
  weight3(x, y, p1, p3, p0, out, 1, 3, 0)
  weight3(x, y, p3, p1, p2, out, 3, 1, 2)
  weight3(x, y, p2, p0, p1, out, 2, 0, 1)
  weight3(x, y, p0, p2, p3, out, 0, 2, 3)
  const scale = 1 / (out[0] + out[1] + out[2] + out[3])
  for (let i = 0; i < 4; i++) {
    out[i] *= scale
  }
}

/**
 * Adds the weights of `v0`, `v1`, `v2` to the lanes `a`, `b`, `c`, nothing when the point lies outside the edge from
 * `v0` to `v1`
 */
function weight3(
  x: number,
  y: number,
  v0: BlendParameter,
  v1: BlendParameter,
  v2: BlendParameter,
  out: Float32Array,
  a: number,
  b: number,
  c: number,
) {
  // the plane through the edge, standing up along z: positive outside
  const nx = v1.y - v0.y
  const ny = v0.x - v1.x
  if (nx * (x - v0.x) + ny * (y - v0.y) > 0) {
    return
  }
  const e0x = v0.x - v2.x
  const e0y = v0.y - v2.y
  const e1x = v1.x - v2.x
  const e1y = v1.y - v2.y
  const dx = x - v2.x
  const dy = y - v2.y
  const w0 = dx * e1y - e1x * dy
  const w1 = e0x * dy - dx * e0y
  out[a] += w0
  out[b] += w1
  out[c] += e0x * e1y - e1x * e0y - w0 - w1
}
