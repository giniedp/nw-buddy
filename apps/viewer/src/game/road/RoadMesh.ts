import { GeometryBuilder, vertexLayout } from '@gglib/graphics'
import {
  vec3,
  vec3$applyMat4,
  vec3$init,
  vec3$normalize,
  vec3AddScaled,
  vec3Cross,
  vec3Dot,
  vec3Length,
  vec3SubtractScaled,
  vec3ToArray,
  type IMat,
  type IVec3,
} from '@gglib/math'
import type { ViewerRoadComponent } from '../../api'
import { Spline, SplineWidth } from './Spline'

/**
 * Terrain height at a world position, undefined if no terrain is loaded there.
 * Must return the height of the rendered terrain at its grid vertices (see sampleRegionHeightAsTerrain).
 */
export type HeightSampler = (x: number, y: number) => number | undefined

export interface RoadMeshOptions {
  /**
   * Terrain grid cell size in world units, the finest terrain patches have one vertex per meter
   */
  cellSize?: number
  /**
   * Height above the terrain (fRoadTerrainZOffset in RoadRenderNode.cpp)
   */
  zOffset?: number
}

/**
 * Interleaved vertex layout of a road strip, matching the Illum vertex input
 * (position, color, texture, normal, tangent with handedness in w)
 */
export const ROAD_VERTEX_LAYOUT = vertexLayout({
  position: 'float32x3',
  color: 'float32x4',
  texture: 'float32x2',
  normal: 'float32x3',
  tangent: 'float32x4',
})

const ROAD_TERRAIN_Z_OFFSET = 0.06

/**
 * Builds the geometry of a road or river strip.
 *
 * Sectors follow SplineGeometry::BuildSplineMesh (RoadsAndRivers gem): every segmentLength along the spline,
 * two points at +/- width / 2 along the spline normal. Each sector trapezoid is then clipped against the terrain
 * grid triangles like CRoadRenderNode does, so the road surface is exactly the terrain surface (plus zOffset) and
 * needs no depth bias. Texture coordinates come from the distances to the trapezoid edges: u runs along the road
 * in tiles (distance / tileLength), v across from 0 to 1. Open roads fade in over the first and out over the
 * last sector (vertex alpha).
 *
 * The terrain cells are split along the diagonal from (x0, y0) to (x1, y1), like the terrain patches
 * (buildPatch with the 'forward' diagonal).
 *
 * @param transform - entity to world transform, column major 4x4
 * @returns a builder with the world space vertices (ROAD_VERTEX_LAYOUT) and calculated bounds,
 *   null if the road has no geometry
 */
export function buildRoadMesh(
  road: ViewerRoadComponent,
  transform: IMat,
  heightAt: HeightSampler,
  options: RoadMeshOptions = {},
): GeometryBuilder | null {
  const sections = buildCrossSections(road, transform)
  if (!sections) {
    return null
  }
  const { left, right, sectorU, sectorCount } = sections
  const cellSize = options.cellSize ?? 1
  const zOffset = options.zOffset ?? ROAD_TERRAIN_Z_OFFSET

  const out = new GeometryBuilder({ layout: [ROAD_VERTEX_LAYOUT] })
  const grid = new GridHeights(heightAt, cellSize)
  const fadeEnds = !sections.closed
  const sector = new Sector()

  for (let i = 0; i < sectorCount; i++) {
    sector.init(left[i], right[i], right[i + 1], left[i + 1], sectorU[i], sectorU[i + 1])
    if (!sector.valid) {
      continue
    }
    const alphaMode = !fadeEnds ? 0 : i === 0 ? 1 : i === sectorCount - 1 ? 2 : 0

    // terrain cells under the trapezoid
    const cx0 = Math.floor(sector.minX / cellSize)
    const cx1 = Math.ceil(sector.maxX / cellSize)
    const cy0 = Math.floor(sector.minY / cellSize)
    const cy1 = Math.ceil(sector.maxY / cellSize)
    for (let cy = cy0; cy < cy1; cy++) {
      for (let cx = cx0; cx < cx1; cx++) {
        // both triangles of the cell, split along (x0, y0) - (x1, y1), counter clockwise seen from above
        emitClipped(out, sector, grid, alphaMode, zOffset, cx, cy, cx + 1, cy, cx + 1, cy + 1)
        emitClipped(out, sector, grid, alphaMode, zOffset, cx, cy, cx + 1, cy + 1, cx, cy + 1)
      }
    }
  }

  if (!out.vertexCount) {
    return null
  }
  return out.calculateBounds()
}

/**
 * Interleaved vertex layout of a river surface: the road layout plus the edge fade
 */
export const RIVER_VERTEX_LAYOUT = vertexLayout({
  position: 'float32x3',
  color: 'float32x4',
  texture: 'float32x2',
  normal: 'float32x3',
  tangent: 'float32x4',
  fade: 'float32x4',
})

export interface RiverMeshOptions {
  /**
   * Texture v at the right bank (TileWidth)
   */
  tileWidth: number
  /**
   * Fog color, rgb
   */
  fogColor: ArrayLike<number>
  /**
   * Fog density, as authored (natural base)
   */
  fogDensity: number
  /**
   * Fade in over this distance at the river start, 0 = no fade (LengthStartFadeDist)
   */
  lengthStartFade?: number
  /**
   * Fade out over this distance at the river end, 0 = no fade (LengthEndFadeDist)
   */
  lengthEndFade?: number
  /**
   * Fade in from both banks over this distance, 0 = no fade (WidthFadeDist)
   */
  widthFade?: number
}

/**
 * Builds the surface of a river.
 *
 * Follows River::GenerateRenderNodes and CWaterVolumeRenderNode::CreateRiver: one quad per spline sector, split
 * into a fan around its center, all vertices projected along Z onto the fog plane. The fog plane passes through
 * the first cross section point with the entity Z axis as normal, which makes the river flat.
 * Texture coordinates: u = distance / tileLength along the river, v = 0..tileWidth across.
 *
 * Vertex attributes besides the road layout (RIVER_VERTEX_LAYOUT):
 * - color: the river fog, rgb = fog color, a = fog density
 * - fade: distances to the river start, end, left and right bank, each divided by its fade distance.
 *   The surface alpha is saturate(min(fade)), all four terms are linear over the triangles.
 *   The fade distances are New World additions (not in Lumberyard), adjacent rivers blend over them.
 *
 * @param transform - entity to world transform, column major 4x4
 * @returns a builder with the world space vertices (RIVER_VERTEX_LAYOUT) and calculated bounds,
 *   null if the river has no geometry
 */
export function buildRiverMesh(
  river: ViewerRoadComponent,
  transform: IMat,
  options: RiverMeshOptions,
): GeometryBuilder | null {
  const sections = buildCrossSections(river, transform)
  if (!sections) {
    return null
  }
  const { left, right, sectorU, sectorCount, distance, length } = sections

  // fog plane: through the first point, normal is the entity up axis
  const planeNormal = vec3$normalize(vec3$init(vec3(), transform[8], transform[9], transform[10]))
  if (!(planeNormal.z > 1e-2)) {
    return null
  }
  const planePoint = left[0]
  const planeZ = (x: number, y: number) =>
    planePoint.z - (planeNormal.x * (x - planePoint.x) + planeNormal.y * (y - planePoint.y)) / planeNormal.z

  // reciprocal fade distances, 0 = no fade. Closed rivers have no ends.
  const invFade = (d: number | undefined) => (d > 0 ? 1 / d : 0)
  const invStart = sections.closed ? 0 : invFade(options.lengthStartFade)
  const invEnd = sections.closed ? 0 : invFade(options.lengthEndFade)
  const invWidth = invFade(options.widthFade)
  // without fade the term stays at 1, so it never wins the min
  const fadeTerm = (d: number, inv: number) => (inv > 0 ? d * inv : 1)

  const tileWidth = options.tileWidth
  const out = new GeometryBuilder({ layout: [RIVER_VERTEX_LAYOUT] })
  const sector = new Sector()
  const corner = vec3()
  const vertex = {
    position: [0, 0, 0],
    color: [options.fogColor[0], options.fogColor[1], options.fogColor[2], options.fogDensity],
    texture: [0, 0],
    normal: [0, 0, 0],
    tangent: [0, 0, 0, 0],
    fade: [0, 0, 0, 0],
  }
  vec3ToArray(planeNormal, vertex.normal)
  // corner order of the sector (counter clockwise seen from above) and their (along, across) parameters
  const cornerT = [0, 0, 1, 1]
  const cornerV = [0, 1, 1, 0]

  const setFade = (along: number, across: number, width: number) => {
    vertex.fade[0] = fadeTerm(along, invStart)
    vertex.fade[1] = fadeTerm(length - along, invEnd)
    vertex.fade[2] = fadeTerm(across, invWidth)
    vertex.fade[3] = fadeTerm(width - across, invWidth)
  }

  for (let i = 0; i < sectorCount; i++) {
    sector.init(left[i], right[i], right[i + 1], left[i + 1], sectorU[i], sectorU[i + 1])
    if (!sector.valid) {
      continue
    }
    tangentFrame(planeNormal, sector, vertex.tangent)
    const widthStart = Math.hypot(right[i].x - left[i].x, right[i].y - left[i].y)
    const widthEnd = Math.hypot(right[i + 1].x - left[i + 1].x, right[i + 1].y - left[i + 1].y)

    const base = out.vertexCount
    let cx = 0
    let cy = 0
    for (let k = 0; k < 4; k++) {
      vec3$init(corner, sector.px[k], sector.py[k], 0)
      corner.z = planeZ(corner.x, corner.y)
      vec3ToArray(corner, vertex.position)
      vertex.texture[0] = sector.u0 + (sector.u1 - sector.u0) * cornerT[k]
      vertex.texture[1] = cornerV[k] * tileWidth
      const width = cornerT[k] ? widthEnd : widthStart
      setFade(cornerT[k] ? distance[i + 1] : distance[i], cornerV[k] * width, width)
      out.addVertex(vertex)
      cx += corner.x * 0.25
      cy += corner.y * 0.25
    }
    vec3$init(corner, cx, cy, planeZ(cx, cy))
    vec3ToArray(corner, vertex.position)
    vertex.texture[0] = (sector.u0 + sector.u1) * 0.5
    vertex.texture[1] = 0.5 * tileWidth
    const centerWidth = (widthStart + widthEnd) * 0.5
    setFade((distance[i] + distance[i + 1]) * 0.5, centerWidth * 0.5, centerWidth)
    out.addVertex(vertex)

    for (let k = 0; k < 4; k++) {
      out.addIndices(base + k, base + ((k + 1) % 4), base + 4)
    }
  }

  if (!out.vertexCount) {
    return null
  }
  return out.calculateBounds()
}

interface CrossSections {
  /**
   * Left end points of the cross sections in world space, sectorCount + 1 entries
   */
  left: IVec3[]
  /**
   * Right end points of the cross sections in world space, sectorCount + 1 entries
   */
  right: IVec3[]
  /**
   * Texture u at each cross section (distance / tileLength)
   */
  sectorU: number[]
  /**
   * Distance along the spline at each cross section
   */
  distance: number[]
  /**
   * Spline length
   */
  length: number
  sectorCount: number
  closed: boolean
}

/**
 * Cross sections along the spline every segmentLength (SplineGeometry::BuildSplineMesh, CaluclateIterationData):
 * two points at +/- width / 2 along the spline normal
 */
function buildCrossSections(road: ViewerRoadComponent, transform: IMat): CrossSections | null {
  const spline = new Spline(road.spline)
  if (spline.segmentCount === 0 || !(spline.length > 0)) {
    return null
  }
  const width = new SplineWidth(road.width, road.widths, spline)
  const tileLength = road.tileLength > 0 ? road.tileLength : 1

  const sectorCount = Math.max(1, Math.ceil(spline.length / Math.max(road.segmentLength || 1, 0.1)))
  const sectorStep = spline.length / sectorCount
  const left: IVec3[] = []
  const right: IVec3[] = []
  const sectorU: number[] = []
  const distances: number[] = []
  const address = { segment: 0, fraction: 0 }
  const pos = vec3()
  const normal = vec3()
  for (let i = 0; i <= sectorCount; i++) {
    const distance = i * sectorStep
    spline.addressByDistance(distance, address)
    spline.position(address, pos)
    spline.normal(address, normal)
    const h = width.at(distance) * 0.5
    left.push(vec3$applyMat4(vec3AddScaled(pos, normal, h), transform))
    right.push(vec3$applyMat4(vec3AddScaled(pos, normal, -h), transform))
    sectorU.push(distance / tileLength)
    distances.push(distance)
  }
  return { left, right, sectorU, distance: distances, length: spline.length, sectorCount, closed: spline.closed }
}

/**
 * A road sector: the trapezoid between two cross sections of the spline
 */
class Sector {
  public valid = false
  public minX = 0
  public minY = 0
  public maxX = 0
  public maxY = 0
  public u0 = 0
  public u1 = 0
  // corners: left start, right start, right end, left end
  public px = [0, 0, 0, 0]
  public py = [0, 0, 0, 0]
  public pz = [0, 0, 0, 0]
  // inward facing edge lines, a * x + b * y + c >= 0 inside. Edges: start, right, end, left
  public la = [0, 0, 0, 0]
  public lb = [0, 0, 0, 0]
  public lc = [0, 0, 0, 0]
  // road direction and across direction (in the xy plane) for the tangent frame
  public forward = vec3()
  public side = vec3()

  public init(leftStart: IVec3, rightStart: IVec3, rightEnd: IVec3, leftEnd: IVec3, u0: number, u1: number) {
    this.setCorner(0, leftStart)
    this.setCorner(1, rightStart)
    this.setCorner(2, rightEnd)
    this.setCorner(3, leftEnd)
    this.u0 = u0
    this.u1 = u1

    let area = 0
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4
      area += this.px[k] * this.py[n] - this.px[n] * this.py[k]
    }
    this.valid = Math.abs(area) > 1e-6
    if (!this.valid) {
      return
    }
    // inward normal of edge k -> n is (-dy, dx) for a counter clockwise polygon, flipped for clockwise
    const sign = area > 0 ? 1 : -1
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4
      const dx = this.px[n] - this.px[k]
      const dy = this.py[n] - this.py[k]
      const len = Math.hypot(dx, dy) || 1
      this.la[k] = (-dy / len) * sign
      this.lb[k] = (dx / len) * sign
      this.lc[k] = -(this.la[k] * this.px[k] + this.lb[k] * this.py[k])
    }
    this.minX = Math.min(this.px[0], this.px[1], this.px[2], this.px[3])
    this.maxX = Math.max(this.px[0], this.px[1], this.px[2], this.px[3])
    this.minY = Math.min(this.py[0], this.py[1], this.py[2], this.py[3])
    this.maxY = Math.max(this.py[0], this.py[1], this.py[2], this.py[3])

    vec3$init(
      this.forward,
      (this.px[3] + this.px[2] - this.px[0] - this.px[1]) * 0.5,
      (this.py[3] + this.py[2] - this.py[0] - this.py[1]) * 0.5,
      (this.pz[3] + this.pz[2] - this.pz[0] - this.pz[1]) * 0.5,
    )
    vec3$init(
      this.side,
      (this.px[1] + this.px[2] - this.px[0] - this.px[3]) * 0.5,
      (this.py[1] + this.py[2] - this.py[0] - this.py[3]) * 0.5,
      0,
    )
  }

  private setCorner(index: number, p: IVec3) {
    this.px[index] = p.x
    this.py[index] = p.y
    this.pz[index] = p.z
  }

  public distance(edge: number, x: number, y: number) {
    return this.la[edge] * x + this.lb[edge] * y + this.lc[edge]
  }

  /**
   * Position along (0 at the start, 1 at the end) and across (0 left, 1 right) from the edge distances,
   * like the texgen in CRoadRenderNode::BuildTangentListLocked
   */
  public param(x: number, y: number, out: { t: number; v: number }) {
    const dStart = Math.max(0, this.distance(0, x, y))
    const dEnd = Math.max(0, this.distance(2, x, y))
    const dLeft = Math.max(0, this.distance(3, x, y))
    const dRight = Math.max(0, this.distance(1, x, y))
    out.t = dStart + dEnd > 1e-9 ? dStart / (dStart + dEnd) : 0
    out.v = dLeft + dRight > 1e-9 ? dLeft / (dLeft + dRight) : 0
    return out
  }

  /**
   * Height of the spline surface, used where no terrain is loaded
   */
  public splineZ(t: number, v: number) {
    const zStart = this.pz[0] + (this.pz[1] - this.pz[0]) * v
    const zEnd = this.pz[3] + (this.pz[2] - this.pz[3]) * v
    return zStart + (zEnd - zStart) * t
  }
}

/**
 * Terrain heights at the grid vertices, cached per road
 */
class GridHeights {
  public readonly cellSize: number
  private sample: HeightSampler
  private cache = new Map<number, number | undefined>()

  public constructor(sample: HeightSampler, cellSize: number) {
    this.sample = sample
    this.cellSize = cellSize
  }

  public at(gx: number, gy: number): number | undefined {
    // grid coordinates of one road stay well inside +/- 2^19, combine into one key
    const key = gx * 1048576 + gy
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    const h = this.sample(gx * this.cellSize, gy * this.cellSize)
    this.cache.set(key, h)
    return h
  }

  /**
   * Terrain normal at the nearest grid vertex, computed like the terrain vertex shader (readMapData)
   */
  public normalAt(x: number, y: number, out: IVec3) {
    const gx = Math.round(x / this.cellSize)
    const gy = Math.round(y / this.cellSize)
    const h = this.at(gx, gy)
    if (h === undefined) {
      vec3$init(out, 0, 0, 1) // UP
      return out
    }
    const hpx = this.at(gx + 1, gy) ?? h
    const hnx = this.at(gx - 1, gy) ?? h
    const hpy = this.at(gx, gy + 1) ?? h
    const hny = this.at(gx, gy - 1) ?? h
    vec3$init(out, hnx - hpx, hny - hpy, 1)
    vec3$normalize(out)
    return out
  }
}

const clipA: number[] = []
const clipB: number[] = []
const tmpParam = { t: 0, v: 0 }
const tmpNormal = vec3()
const tmpTangent = vec3()
const tmpBitangent = vec3()

/**
 * Clips the terrain triangle (grid coordinates) against the sector and appends the result as a triangle fan.
 * Heights are interpolated on the triangle plane, matching the rendered terrain.
 */
function emitClipped(
  out: GeometryBuilder,
  sector: Sector,
  grid: GridHeights,
  alphaMode: number,
  zOffset: number,
  gax: number,
  gay: number,
  gbx: number,
  gby: number,
  gcx: number,
  gcy: number,
) {
  const cs = grid.cellSize
  const ax = gax * cs
  const ay = gay * cs
  const bx = gbx * cs
  const by = gby * cs
  const cx = gcx * cs
  const cy = gcy * cs

  // Sutherland Hodgman against the four inward edges, polygons as flat x, y lists
  let src = clipA
  let dst = clipB
  src.length = 0
  src.push(ax, ay, bx, by, cx, cy)
  for (let edge = 0; edge < 4 && src.length >= 6; edge++) {
    dst.length = 0
    const n = src.length / 2
    for (let k = 0; k < n; k++) {
      const x0 = src[k * 2]
      const y0 = src[k * 2 + 1]
      const x1 = src[((k + 1) % n) * 2]
      const y1 = src[((k + 1) % n) * 2 + 1]
      const d0 = sector.distance(edge, x0, y0)
      const d1 = sector.distance(edge, x1, y1)
      if (d0 >= 0) {
        dst.push(x0, y0)
      }
      if (d0 >= 0 !== d1 >= 0) {
        const t = d0 / (d0 - d1)
        dst.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
      }
    }
    const swap = src
    src = dst
    dst = swap
  }
  const count = src.length / 2
  if (count < 3) {
    return
  }

  // plane of the terrain triangle
  const ha = grid.at(gax, gay)
  const hb = grid.at(gbx, gby)
  const hc = grid.at(gcx, gcy)
  const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
  const hasTerrain = ha != null && hb != null && hc != null && Math.abs(det) > 1e-12

  const base = out.vertexCount
  for (let k = 0; k < count; k++) {
    const x = src[k * 2]
    const y = src[k * 2 + 1]
    sector.param(x, y, tmpParam)
    let z: number
    if (hasTerrain) {
      const wa = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det
      const wb = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det
      z = ha * wa + hb * wb + hc * (1 - wa - wb) + zOffset
    } else {
      z = sector.splineZ(tmpParam.t, tmpParam.v)
    }
    const u = sector.u0 + (sector.u1 - sector.u0) * tmpParam.t
    const alpha = alphaMode === 1 ? tmpParam.t : alphaMode === 2 ? 1 - tmpParam.t : 1
    const n = hasTerrain ? grid.normalAt(x, y, tmpNormal) : vec3$init(tmpNormal, 0, 0, 1)
    addVertex(out, x, y, z, alpha, u, tmpParam.v, n, sector)
  }
  for (let k = 1; k < count - 1; k++) {
    out.addIndices(base, base + k, base + k + 1)
  }
}

const tmpVertex = {
  position: [0, 0, 0],
  color: [1, 1, 1, 1],
  texture: [0, 0],
  normal: [0, 0, 0],
  tangent: [0, 0, 0, 0],
}

function addVertex(
  out: GeometryBuilder,
  x: number,
  y: number,
  z: number,
  alpha: number,
  u: number,
  v: number,
  n: IVec3,
  sector: Sector,
) {
  const vertex = tmpVertex
  vertex.position[0] = x
  vertex.position[1] = y
  vertex.position[2] = z
  vertex.color[3] = alpha
  vertex.texture[0] = u
  vertex.texture[1] = v
  vec3ToArray(n, vertex.normal)
  tangentFrame(n, sector, vertex.tangent)
  out.addVertex(vertex)
}

/**
 * Tangent along u (the sector forward direction) orthogonalized against the normal, handedness in w
 */
function tangentFrame(n: IVec3, sector: Sector, out: number[]) {
  const t = vec3SubtractScaled(sector.forward, n, vec3Dot(sector.forward, n), tmpTangent)
  if (vec3Length(t) > 0) {
    vec3$normalize(t)
  }
  // the shader computes bitangent = cross(normal, tangent) * w, it has to point along +v (left to right)
  const b = vec3Cross(n, t, tmpBitangent)
  vec3ToArray(t, out)
  out[3] = vec3Dot(b, sector.side) < 0 ? -1 : 1
}
