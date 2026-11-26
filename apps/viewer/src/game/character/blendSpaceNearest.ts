import type { ParaGroupBlendSpace } from '../../formats/bspace'
import type { BlendSpaceGridCorner, PreparedDimension } from './blendSpace'

/**
 * The grid of a 2D or 3D blend space without a usable `VGrid`, a fallback (not the game's rule): each cell corner holds
 * the example nearest to it alone, distances measured in the dimension ranges. The sampler's interpolation between the
 * corners blends neighboring examples. Faces and pseudo examples are ignored.
 */
export function buildGridFromNearest(
  file: string,
  space: ParaGroupBlendSpace,
  dimensions: PreparedDimension[],
): BlendSpaceGridCorner[] {
  const lanes = 1 << dimensions.length
  const positions = space.examples.map((example) => {
    return dimensions.map((dimension, lane) => {
      const value = example.params[lane]
      if (value == null) {
        throw new Error(`${file}: no grid and an example without SetPara${lane} (root motion extraction is not ported)`)
      }
      return (value - dimension.min) / range(dimension)
    })
  })
  if (!positions.length) {
    throw new Error(`${file}: no examples`)
  }
  const corners = dimensions.reduce((count, it) => count * it.cells, 1)
  const corner = new Float32Array(dimensions.length)
  const grid: BlendSpaceGridCorner[] = []
  for (let index = 0; index < corners; index++) {
    // x fastest
    let rest = index
    for (let lane = 0; lane < dimensions.length; lane++) {
      const cells = dimensions[lane].cells
      corner[lane] = (rest % cells) / (cells - 1)
      rest = Math.floor(rest / cells)
    }
    const indices = new Array<number>(lanes).fill(0)
    const weights = new Array<number>(lanes).fill(0)
    indices[0] = nearest(positions, corner)
    weights[0] = 1
    grid.push({ indices, weights })
  }
  return grid
}

function range(dimension: PreparedDimension) {
  const span = dimension.max - dimension.min
  return span === 0 ? 1 : span
}

/**
 * The first example with the smallest distance to the corner
 */
function nearest(positions: number[][], corner: Float32Array) {
  let best = 0
  let closest = Infinity
  for (let example = 0; example < positions.length; example++) {
    let distance = 0
    for (let lane = 0; lane < corner.length; lane++) {
      const delta = positions[example][lane] - corner[lane]
      distance += delta * delta
    }
    if (distance < closest) {
      closest = distance
      best = example
    }
  }
  return best
}
