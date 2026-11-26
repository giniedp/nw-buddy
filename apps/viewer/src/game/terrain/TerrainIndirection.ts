import { Device, type Texture, type WebGpuDevice, type WebGpuTexture } from '@gglib/graphics'
import { VT_MIP_COUNT, VT_PAGE_WORLD_SIZE } from '../../constants'
import type { TerrainPage, TerrainPages } from './TerrainPages'
import type { TerrainRegionComponent } from './TerrainRegionComponent'

/**
 * Maximum number of regions loaded at the same time, they form a 2x2 window
 */
export const INDIRECTION_REGION_SLOTS = 4

interface DirtyRect {
  x0: number
  y0: number
  x1: number
  y1: number
}

interface RegionEntry {
  region: TerrainRegionComponent
  layer: number
  /**
   * CPU copy of each indirection level, RGBA8, row y = page y (world y up)
   */
  levels: Uint8Array[]
  dirty: Array<DirtyRect | null>
}

/**
 * Indirection maps of the terrain virtual texture, one array layer per loaded region.
 *
 * Level m holds one entry per mip m page of the region. An entry points to the finest resident page
 * covering it at mip >= m (the fallback rule of the original VirtualTexture), encoded as
 * r = slot & 0xff, g = slot >> 8, b = page mip, a = 255 if valid.
 */
export class TerrainIndirection {
  public readonly texture: Texture
  public readonly size: number

  private device: Device
  private pages: TerrainPages
  private entries: Array<RegionEntry | null> = new Array(INDIRECTION_REGION_SLOTS).fill(null)

  public constructor(device: Device, pages: TerrainPages, regionSize: number) {
    this.device = device
    this.pages = pages
    this.size = regionSize / VT_PAGE_WORLD_SIZE
    this.texture = device.createTexture({
      name: 'VTIndirection',
      format: 'rgba8unorm',
      type: '2d-array',
      width: this.size,
      height: this.size,
      depth: INDIRECTION_REGION_SLOTS,
      generateMipmap: false,
      mipLevelCount: VT_MIP_COUNT,
    })
  }

  /**
   * Array layer of the region, -1 if the region has no indirection
   */
  public layerOf(region: TerrainRegionComponent): number {
    for (const entry of this.entries) {
      if (entry?.region === region) {
        return entry.layer
      }
    }
    return -1
  }

  /**
   * Assigns layers to the given regions and releases layers of regions that are gone
   */
  public sync(regions: ReadonlyArray<TerrainRegionComponent>) {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]
      if (entry && !regions.includes(entry.region)) {
        this.entries[i] = null
      }
    }
    for (const region of regions) {
      if (this.layerOf(region) >= 0) {
        continue
      }
      const layer = this.entries.indexOf(null)
      if (layer < 0) {
        console.warn('TerrainIndirection: no free region layer', region.regionName)
        continue
      }
      this.entries[layer] = this.createEntry(region, layer)
    }
  }

  private createEntry(region: TerrainRegionComponent, layer: number): RegionEntry {
    const entry: RegionEntry = { region, layer, levels: [], dirty: [] }
    for (let level = 0; level < VT_MIP_COUNT; level++) {
      const n = this.size >> level
      entry.levels.push(new Uint8Array(n * n * 4))
      entry.dirty.push({ x0: 0, y0: 0, x1: n, y1: n })
    }
    // pages that are already resident, e.g. the region was reloaded, coarse first so finer ones refine
    const resident = this.pages.residentOf(region).sort((a, b) => b.mip - a.mip)
    for (const page of resident) {
      this.update(entry, page.mip, page.x, page.y, false)
    }
    return entry
  }

  /**
   * Updates the entries covered by the page after it became resident or was evicted
   */
  public pageChanged(page: TerrainPage) {
    const entry = this.entries.find((it) => it?.region === page.region)
    if (entry) {
      this.update(entry, page.mip, page.x, page.y, true)
    }
  }

  private update(entry: RegionEntry, mip: number, x: number, y: number, markDirty: boolean) {
    const top = VT_MIP_COUNT - 1
    for (let level = mip; level >= 0; level--) {
      const shift = mip - level
      const n = 1 << shift
      const x0 = x << shift
      const y0 = y << shift
      const size = this.size >> level
      const data = entry.levels[level]
      const parent = level < top ? entry.levels[level + 1] : null
      const parentSize = size >> 1
      for (let ey = y0; ey < y0 + n; ey++) {
        for (let ex = x0; ex < x0 + n; ex++) {
          const o = (ey * size + ex) * 4
          const page = this.pages.findResident(entry.region, level, ex, ey)
          if (page) {
            data[o] = page.slot & 0xff
            data[o + 1] = page.slot >> 8
            data[o + 2] = page.mip
            data[o + 3] = 255
          } else if (parent) {
            const p = ((ey >> 1) * parentSize + (ex >> 1)) * 4
            data[o] = parent[p]
            data[o + 1] = parent[p + 1]
            data[o + 2] = parent[p + 2]
            data[o + 3] = parent[p + 3]
          } else {
            data[o] = data[o + 1] = data[o + 2] = data[o + 3] = 0
          }
        }
      }
      if (markDirty) {
        markRect(entry.dirty, level, x0, y0, x0 + n, y0 + n)
      }
    }
  }

  /**
   * Uploads the changed parts of all levels
   */
  public upload() {
    const gpu = (this.device as WebGpuDevice).gpu
    const texture = (this.texture as WebGpuTexture).gpuObject
    for (const entry of this.entries) {
      if (!entry) {
        continue
      }
      for (let level = 0; level < VT_MIP_COUNT; level++) {
        const rect = entry.dirty[level]
        if (!rect) {
          continue
        }
        entry.dirty[level] = null
        const size = this.size >> level
        gpu.queue.writeTexture(
          { texture, mipLevel: level, origin: { x: rect.x0, y: rect.y0, z: entry.layer } },
          entry.levels[level],
          { offset: (rect.y0 * size + rect.x0) * 4, bytesPerRow: size * 4, rowsPerImage: size },
          { width: rect.x1 - rect.x0, height: rect.y1 - rect.y0, depthOrArrayLayers: 1 },
        )
      }
    }
  }

  /**
   * CPU copy of an indirection level, for debugging
   */
  public levelData(region: TerrainRegionComponent, level: number): Uint8Array | null {
    return this.entries.find((it) => it?.region === region)?.levels[level] ?? null
  }

  /**
   * Reads an indirection level back from the GPU, for debugging
   */
  public async readLevel(layer: number, level: number): Promise<Uint8Array> {
    const gpu = (this.device as WebGpuDevice).gpu
    const size = this.size >> level
    const bytesPerRow = Math.ceil((size * 4) / 256) * 256
    const buffer = gpu.createBuffer({ usage: 8 | 1, size: bytesPerRow * size }) // COPY_DST | MAP_READ
    const encoder = gpu.createCommandEncoder()
    encoder.copyTextureToBuffer(
      { texture: (this.texture as WebGpuTexture).gpuObject, mipLevel: level, origin: { x: 0, y: 0, z: layer } },
      { buffer, bytesPerRow, rowsPerImage: size },
      { width: size, height: size, depthOrArrayLayers: 1 },
    )
    gpu.queue.submit([encoder.finish()])
    await buffer.mapAsync(1) // READ
    const mapped = new Uint8Array(buffer.getMappedRange())
    const result = new Uint8Array(size * size * 4)
    for (let row = 0; row < size; row++) {
      result.set(mapped.subarray(row * bytesPerRow, row * bytesPerRow + size * 4), row * size * 4)
    }
    buffer.unmap()
    buffer.destroy()
    return result
  }

  public dispose() {
    this.texture.dispose()
  }
}

function markRect(dirty: Array<DirtyRect | null>, level: number, x0: number, y0: number, x1: number, y1: number) {
  const rect = dirty[level]
  if (!rect) {
    dirty[level] = { x0, y0, x1, y1 }
    return
  }
  rect.x0 = Math.min(rect.x0, x0)
  rect.y0 = Math.min(rect.y0, y0)
  rect.x1 = Math.max(rect.x1, x1)
  rect.y1 = Math.max(rect.y1, y1)
}
