import { clamp } from '@gglib/math'

/**
 * Heightmap of one region, square and row major with row 0 at the region max y
 *
 * @remarks
 * Plain data, so it can be sampled on the main thread (TerrainRegionComponent) and in workers (shared slots)
 */
export interface RegionHeightmap {
  heightmap: ArrayLike<number>
  origin: { x: number; y: number }
  /**
   * Region size in world units
   */
  size: number
  mountainHeight: number
}

/**
 * Bilinear height lookup at world position, the heightmap is row major with flipped y axis
 */
export function sampleRegionHeight(region: RegionHeightmap, worldX: number, worldY: number) {
  const map = region.heightmap
  const size = Math.round(Math.sqrt(map.length))
  const fx = clamp(((worldX - region.origin.x) / region.size) * size, 0, size - 1)
  const fy = clamp(((worldY - region.origin.y) / region.size) * size, 0, size - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, size - 1)
  const y1 = Math.min(y0 + 1, size - 1)
  const tx = fx - x0
  const ty = fy - y0
  const r0 = (size - 1 - y0) * size
  const r1 = (size - 1 - y1) * size
  const h0 = map[r0 + x0] * (1 - tx) + map[r0 + x1] * tx
  const h1 = map[r1 + x0] * (1 - tx) + map[r1 + x1] * tx
  return ((h0 * (1 - ty) + h1 * ty) / 0xffff) * region.mountainHeight
}

/**
 * Height exactly as the terrain vertex shader sees it: a linear filtered sample at uv = local / regionSize
 * with v flipped (TerrainPatchMaterial readMapData). Integer world positions land on texel edges, so the
 * result is the average of the surrounding texels, half a texel off compared to sampleRegionHeight.
 * Use this to put geometry exactly onto the rendered terrain.
 */
export function sampleRegionHeightAsTerrain(region: RegionHeightmap, worldX: number, worldY: number) {
  const map = region.heightmap
  const size = Math.round(Math.sqrt(map.length))
  const scale = size / region.size
  // texel space, texel centers at i + 0.5, row 0 at the region max y
  const fx = clamp((worldX - region.origin.x) * scale - 0.5, 0, size - 1)
  const fy = clamp((region.origin.y + region.size - worldY) * scale - 0.5, 0, size - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(x0 + 1, size - 1)
  const y1 = Math.min(y0 + 1, size - 1)
  const tx = fx - x0
  const ty = fy - y0
  const r0 = y0 * size
  const r1 = y1 * size
  const h0 = map[r0 + x0] * (1 - tx) + map[r0 + x1] * tx
  const h1 = map[r1 + x0] * (1 - tx) + map[r1 + x1] * tx
  return ((h0 * (1 - ty) + h1 * ty) / 0xffff) * region.mountainHeight
}

/**
 * Whether the world position lies within the region bounds (inclusive)
 */
export function regionContains(region: RegionHeightmap, worldX: number, worldY: number) {
  const lx = worldX - region.origin.x
  const ly = worldY - region.origin.y
  return lx >= 0 && ly >= 0 && lx <= region.size && ly <= region.size
}
