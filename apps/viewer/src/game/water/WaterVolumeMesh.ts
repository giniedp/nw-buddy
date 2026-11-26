import { GeometryBuilder } from '@gglib/graphics'
import { vec3, vec3$applyMat4, vec3$init, vec3$normalize, vec3Cross, vec3Dot, type IMat, type IVec3 } from '@gglib/math'
import type { ViewerShape } from '../../api'
import { RIVER_VERTEX_LAYOUT } from '../road/RoadMesh'

export interface WaterVolumeMeshOptions {
  /**
   * Texture coordinates per world unit along x and y (SurfaceUScale, SurfaceVScale)
   */
  uScale: number
  vScale: number
  /**
   * Fog color, rgb
   */
  fogColor: ArrayLike<number>
  /**
   * Fog density, as authored (natural base)
   */
  fogDensity: number
  /**
   * Whether the fog color is multiplied with the sun color (FogColorAffectedBySun), defaults to true
   */
  fogAffectedBySun?: boolean
}

/**
 * Builds the surface of a water volume (Water gem).
 *
 * Follows WaterVolumeCommon (UpdateVertices, UpdateWaterArea) and CWaterVolumeRenderNode::CreateArea:
 * - the outline is the top of the shape in entity space: prism vertices at +height, box corners and
 *   cylinder segments (4 per meter of radius + 16) at +height / 2
 * - all vertices are projected along Z onto the fog plane, which passes through the first vertex with the
 *   entity Z axis as normal
 * - texture coordinates are the world xy offset to the first vertex times the surface scale
 * - the outline is triangulated as a simple polygon
 *
 * Uses the river vertex layout: the vertex color carries the fog (rgb = color, a = density, negative when the
 * fog is not affected by the sun), there is no edge fade.
 *
 * @param transform - entity to world transform, column major 4x4
 * @returns a builder with the world space vertices (RIVER_VERTEX_LAYOUT) and calculated bounds,
 *   null if the shape has no surface
 */
export function buildWaterVolumeMesh(
  shape: ViewerShape,
  transform: IMat,
  options: WaterVolumeMeshOptions,
): GeometryBuilder | null {
  const outline = shapeOutline(shape)
  if (!outline || outline.length < 3) {
    return null
  }
  const normal = vec3$normalize(vec3$init(vec3(), transform[8], transform[9], transform[10]))
  if (!(normal.z > 1e-4)) {
    return null
  }
  const points = outline.map((p) => vec3$applyMat4(p, transform))
  const origin = points[0]
  for (const p of points) {
    // MapVertexToFogPlane: move along Z onto the plane
    p.z = origin.z - (normal.x * (p.x - origin.x) + normal.y * (p.y - origin.y)) / normal.z
  }

  const triangles = triangulate(points)
  if (!triangles.length) {
    return null
  }

  // tangent along +u (world x) on the plane, the bitangent has to point along +v (world y)
  const tangent = vec3(normal.z, 0, -normal.x)
  vec3$normalize(tangent)
  const bitangent = vec3Cross(normal, tangent)
  const w = vec3Dot(bitangent, vec3(0, 1, 0)) < 0 ? -1 : 1

  const out = new GeometryBuilder({ layout: [RIVER_VERTEX_LAYOUT] })
  const vertex = {
    position: [0, 0, 0],
    color: [
      options.fogColor[0],
      options.fogColor[1],
      options.fogColor[2],
      options.fogAffectedBySun === false ? -options.fogDensity : options.fogDensity,
    ],
    texture: [0, 0],
    normal: [normal.x, normal.y, normal.z],
    tangent: [tangent.x, tangent.y, tangent.z, w],
    fade: [1, 1, 1, 1],
  }
  for (const p of points) {
    vertex.position[0] = p.x
    vertex.position[1] = p.y
    vertex.position[2] = p.z
    vertex.texture[0] = options.uScale * (p.x - origin.x)
    vertex.texture[1] = options.vScale * (p.y - origin.y)
    out.addVertex(vertex)
  }
  for (const index of triangles) {
    out.addIndex(index)
  }
  return out.calculateBounds()
}

/**
 * Top outline of the shape in entity space
 */
export function shapeOutline(shape: ViewerShape): IVec3[] | null {
  const cx = shape.center?.[0] ?? 0
  const cy = shape.center?.[1] ?? 0
  const cz = shape.center?.[2] ?? 0
  switch (shape.kind) {
    case 'prism': {
      const height = shape.height ?? 0
      return (shape.vertices ?? []).map(([x, y]) => vec3(cx + x, cy + y, cz + height))
    }
    case 'box': {
      const [hx, hy, hz] = shape.halfExtents ?? [0, 0, 0]
      return [
        vec3(cx + hx, cy + hy, cz + hz),
        vec3(cx + hx, cy - hy, cz + hz),
        vec3(cx - hx, cy - hy, cz + hz),
        vec3(cx - hx, cy + hy, cz + hz),
      ]
    }
    case 'cylinder': {
      const radius = shape.radius ?? 0
      const z = cz + (shape.height ?? 0) * 0.5
      const segments = Math.ceil(radius) * 4 + 16
      const result: IVec3[] = []
      for (let i = 0; i < segments; i++) {
        const a = (i * 2 * Math.PI) / segments
        result.push(vec3(cx + radius * Math.cos(a), cy + radius * Math.sin(a), z))
      }
      return result
    }
    default:
      return null
  }
}

/**
 * Ear clipping triangulation of a simple polygon in the xy plane.
 * Returns triangle indices, counter clockwise seen from above, regardless of the input winding.
 */
export function triangulate(points: ReadonlyArray<{ x: number; y: number }>): number[] {
  const count = points.length
  if (count < 3) {
    return []
  }
  let area = 0
  for (let i = 0; i < count; i++) {
    const a = points[i]
    const b = points[(i + 1) % count]
    area += a.x * b.y - b.x * a.y
  }
  if (Math.abs(area) < 1e-9) {
    return []
  }
  // work on a counter clockwise index list
  const remaining: number[] = []
  for (let i = 0; i < count; i++) {
    remaining.push(area > 0 ? i : count - 1 - i)
  }

  const result: number[] = []
  let guard = count * count
  while (remaining.length > 3 && guard-- > 0) {
    let clipped = false
    for (let i = 0; i < remaining.length; i++) {
      const ia = remaining[(i + remaining.length - 1) % remaining.length]
      const ib = remaining[i]
      const ic = remaining[(i + 1) % remaining.length]
      if (!isEar(points, remaining, ia, ib, ic)) {
        continue
      }
      result.push(ia, ib, ic)
      remaining.splice(i, 1)
      clipped = true
      break
    }
    if (!clipped) {
      // degenerate or self intersecting input, fan the rest like the original does with bad contours
      break
    }
  }
  for (let i = 1; i + 1 < remaining.length; i++) {
    result.push(remaining[0], remaining[i], remaining[i + 1])
  }
  return result
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function isEar(
  points: ReadonlyArray<{ x: number; y: number }>,
  remaining: number[],
  ia: number,
  ib: number,
  ic: number,
) {
  const a = points[ia]
  const b = points[ib]
  const c = points[ic]
  // convex corner
  if (cross(a, b, c) <= 0) {
    return false
  }
  // no other vertex inside the triangle
  for (const index of remaining) {
    if (index === ia || index === ib || index === ic) {
      continue
    }
    const p = points[index]
    if (cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0) {
      return false
    }
  }
  return true
}
