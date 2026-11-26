import type { BoundingBox } from '@gglib/math'

const LEAF_SIZE = 4

/**
 * Bounding volume hierarchy over the triangles of an indexed mesh, built once per mesh shape
 *
 * @remarks
 * Nodes are stored flat: 6 floats bounds per node, and per node either two children (`left` is the first child,
 * the second child follows its subtree) or a range of triangles in `order`. Median split on the longest axis of the
 * triangle centroids.
 */
export class TriangleBvh {
  public readonly vertices: Float32Array
  public readonly indices: ArrayLike<number>
  /**
   * Triangle indices, grouped by leaf
   */
  private order: Uint32Array
  private bounds: Float32Array
  /**
   * Leaf: start in `order`, inner node: -1
   */
  private start: Int32Array
  /**
   * Leaf: triangle count, inner node: index of the second child
   */
  private count: Int32Array
  private nodeCount = 0
  private readonly stack: Int32Array

  public constructor(vertices: Float32Array, indices: ArrayLike<number>) {
    this.vertices = vertices
    this.indices = indices
    const triangles = Math.floor(indices.length / 3)
    this.order = new Uint32Array(triangles)
    const maxNodes = Math.max(1, 2 * Math.ceil(triangles / LEAF_SIZE) * 2)
    this.bounds = new Float32Array(maxNodes * 6)
    this.start = new Int32Array(maxNodes)
    this.count = new Int32Array(maxNodes)
    // depth is about log2(triangles / LEAF_SIZE), meshes have 16 bit indices
    this.stack = new Int32Array(128)

    const centroids = new Float32Array(triangles * 3)
    for (let t = 0; t < triangles; t++) {
      this.order[t] = t
      for (let axis = 0; axis < 3; axis++) {
        centroids[t * 3 + axis] =
          (vertices[indices[t * 3] * 3 + axis] +
            vertices[indices[t * 3 + 1] * 3 + axis] +
            vertices[indices[t * 3 + 2] * 3 + axis]) /
          3
      }
    }
    if (triangles) {
      this.build(centroids, 0, triangles)
    }
  }

  /**
   * Calls `visit` with each triangle whose node bounds overlap the box (local space of the mesh)
   */
  public query(
    min: { x: number; y: number; z: number },
    max: { x: number; y: number; z: number },
    visit: (triangle: number) => void,
  ) {
    if (!this.nodeCount) {
      return
    }
    const bounds = this.bounds
    const stack = this.stack
    let top = 0
    stack[top++] = 0
    while (top) {
      const node = stack[--top]
      const b = node * 6
      if (
        bounds[b] > max.x ||
        bounds[b + 1] > max.y ||
        bounds[b + 2] > max.z ||
        bounds[b + 3] < min.x ||
        bounds[b + 4] < min.y ||
        bounds[b + 5] < min.z
      ) {
        continue
      }
      if (this.start[node] >= 0) {
        const end = this.start[node] + this.count[node]
        for (let i = this.start[node]; i < end; i++) {
          visit(this.order[i])
        }
      } else {
        stack[top++] = node + 1
        stack[top++] = this.count[node]
      }
    }
  }

  /**
   * Writes the local bounds of all triangles
   */
  public getBounds(out: BoundingBox) {
    const b = this.bounds
    out.min.x = b[0]
    out.min.y = b[1]
    out.min.z = b[2]
    out.max.x = b[3]
    out.max.y = b[4]
    out.max.z = b[5]
    return out
  }

  private build(centroids: Float32Array, from: number, to: number): number {
    const node = this.nodeCount++
    this.writeBounds(node, from, to)
    if (to - from <= LEAF_SIZE) {
      this.start[node] = from
      this.count[node] = to - from
      return node
    }
    // split on the longest axis of the centroid bounds at the median
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity
    for (let i = from; i < to; i++) {
      const c = this.order[i] * 3
      minX = Math.min(minX, centroids[c])
      minY = Math.min(minY, centroids[c + 1])
      minZ = Math.min(minZ, centroids[c + 2])
      maxX = Math.max(maxX, centroids[c])
      maxY = Math.max(maxY, centroids[c + 1])
      maxZ = Math.max(maxZ, centroids[c + 2])
    }
    const sx = maxX - minX
    const sy = maxY - minY
    const sz = maxZ - minZ
    const axis = sx >= sy && sx >= sz ? 0 : sy >= sz ? 1 : 2
    const range = this.order.subarray(from, to)
    range.sort((a, b) => centroids[a * 3 + axis] - centroids[b * 3 + axis])
    const mid = (from + to) >> 1

    this.start[node] = -1
    this.build(centroids, from, mid)
    this.count[node] = this.build(centroids, mid, to)
    return node
  }

  private writeBounds(node: number, from: number, to: number) {
    const v = this.vertices
    const idx = this.indices
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity
    for (let i = from; i < to; i++) {
      const t = this.order[i] * 3
      for (let k = 0; k < 3; k++) {
        const p = idx[t + k] * 3
        minX = Math.min(minX, v[p])
        minY = Math.min(minY, v[p + 1])
        minZ = Math.min(minZ, v[p + 2])
        maxX = Math.max(maxX, v[p])
        maxY = Math.max(maxY, v[p + 1])
        maxZ = Math.max(maxZ, v[p + 2])
      }
    }
    const b = node * 6
    this.bounds[b] = minX
    this.bounds[b + 1] = minY
    this.bounds[b + 2] = minZ
    this.bounds[b + 3] = maxX
    this.bounds[b + 4] = maxY
    this.bounds[b + 5] = maxZ
  }
}
