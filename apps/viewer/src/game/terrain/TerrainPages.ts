import { BoundingBox, type BoundingFrustum, type IVec3 } from '@gglib/math'
import { VT_MIP_COUNT, VT_PAGE_CAPACITY, VT_PAGE_SIZE, VT_PAGE_WORLD_SIZE } from '../../constants'
import type { TerrainRegionComponent } from './TerrainRegionComponent'
import { sampleRegionHeight } from './heightSampling'

/**
 * A page of the terrain virtual texture.
 *
 * Pages are square areas of a region. A page at mip m covers VT_PAGE_WORLD_SIZE * 2^m meters
 * and is baked at VT_PAGE_SIZE texels. Pages never cross region borders.
 */
export interface TerrainPage {
  key: number
  region: TerrainRegionComponent
  mip: number
  x: number
  y: number
  /**
   * Slot in the physical page cache, -1 if not resident
   */
  slot: number
  /**
   * Frame in which the page was last requested
   */
  lastUsed: number
  /**
   * Camera distance at the time of the last request, used for prioritization
   */
  distance: number
  /**
   * Whether the page was selected for rendering this frame (as opposed to a fallback ancestor)
   */
  selected: boolean
  /**
   * Height at the page center, used for distance and debug drawing
   */
  height: number
  /**
   * Region material version the page content was baked with, -1 if never baked
   */
  version: number
}

export interface TerrainPageStats {
  selectedPerMip: number[]
  requested: number
  resident: number
  pending: number
  evicted: number
  overflow: number
}

export function pageWorldSize(mip: number) {
  return VT_PAGE_WORLD_SIZE * (1 << mip)
}

/**
 * Selects the virtual texture pages needed for the current view and keeps track of their residency.
 *
 * Selection works like the CDLOD selection but on page level: starting with the coarsest pages
 * of each region, a page is subdivided while the camera is closer than lodFactor * page size.
 * Ancestors of selected pages are requested as well, so a coarser fallback is always available.
 */
export class TerrainPages {
  /**
   * Texel to pixel ratio, see VT_LOD_QUALITY
   */
  public quality: number
  /**
   * Pages are subdivided while the camera is closer than lodFactor * page size.
   * Derived from quality and the camera focal length in pixels.
   */
  public lodFactor = 1
  public readonly capacity: number
  /**
   * Maximum number of pages that become resident per frame
   */
  public bakeBudget = 4

  /**
   * Renders the page content into page.slot
   */
  public bake: (page: TerrainPage) => void = null

  /**
   * Whether pages of the region can be baked, e.g. materials are loaded
   */
  public canBake: (region: TerrainRegionComponent) => boolean = () => true

  /**
   * Called when a page gained content (first bake into its slot) or lost its slot (eviction)
   */
  public onResidencyChange: (page: TerrainPage) => void = null

  public readonly stats: TerrainPageStats = {
    selectedPerMip: new Array(VT_MIP_COUNT).fill(0),
    requested: 0,
    resident: 0,
    pending: 0,
    evicted: 0,
    overflow: 0,
  }

  /**
   * Pages selected for rendering in the current frame
   */
  public readonly selected: TerrainPage[] = []

  private pages = new Map<number, TerrainPage>()
  private pending: TerrainPage[] = []
  private freeSlots: number[] = []
  private residentPages: TerrainPage[] = []
  private frame = 0
  private box = BoundingBox.create()

  public constructor(options: { capacity?: number; quality: number }) {
    this.capacity = options.capacity ?? VT_PAGE_CAPACITY
    this.quality = options.quality
    for (let i = this.capacity - 1; i >= 0; i--) {
      this.freeSlots.push(i)
    }
  }

  /**
   * @param focalPx - camera focal length in pixels, projection[5] * viewport height / 2
   */
  public update(
    regions: ReadonlyArray<TerrainRegionComponent>,
    camera: IVec3,
    frustum: BoundingFrustum,
    focalPx: number,
  ) {
    this.frame++
    // a page at mip m holds VT_PAGE_SIZE texels over its size, the screen shows focalPx / distance pixels per meter
    this.lodFactor = Math.min(8, Math.max(1, (this.quality * focalPx) / VT_PAGE_SIZE))
    this.selected.length = 0
    this.pending.length = 0
    this.stats.selectedPerMip.fill(0)
    this.stats.requested = 0
    this.stats.evicted = 0
    this.stats.overflow = 0

    const topMip = VT_MIP_COUNT - 1
    const topSize = pageWorldSize(topMip)
    for (const region of regions) {
      if (!region.heightmap) {
        continue
      }
      const count = region.size / topSize
      for (let y = 0; y < count; y++) {
        for (let x = 0; x < count; x++) {
          this.selectPage(region, topMip, x, y, camera, frustum)
        }
      }
    }

    this.makeResident()
    this.forgetUnused()
    this.stats.resident = this.residentPages.length
    this.stats.pending = this.pending.length
  }

  private selectPage(
    region: TerrainRegionComponent,
    mip: number,
    x: number,
    y: number,
    camera: IVec3,
    frustum: BoundingFrustum,
  ): void {
    const size = pageWorldSize(mip)
    const minX = region.origin.x + x * size
    const minY = region.origin.y + y * size
    const height = sampleRegionHeight(region, minX + size * 0.5, minY + size * 0.5)

    // nearest point on the page rect, at the page center height
    const dx = camera.x - Math.max(minX, Math.min(camera.x, minX + size))
    const dy = camera.y - Math.max(minY, Math.min(camera.y, minY + size))
    const dz = camera.z - height
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

    // pages near the camera are kept regardless of the frustum, so turning around does not trigger bakes
    if (distance > this.lodFactor * pageWorldSize(1)) {
      const box = this.box
      box.min.x = minX
      box.min.y = minY
      box.min.z = height - size
      box.max.x = minX + size
      box.max.y = minY + size
      box.max.z = height + size
      if (!frustum.intersectsBox(box)) {
        return
      }
    }

    const page = this.request(region, mip, x, y, distance, height)
    if (mip > 0 && distance < this.lodFactor * size) {
      for (let i = 0; i < 4; i++) {
        this.selectPage(region, mip - 1, x * 2 + (i & 1), y * 2 + (i >> 1), camera, frustum)
      }
      return
    }

    page.selected = true
    this.selected.push(page)
    this.stats.selectedPerMip[mip]++
  }

  private request(region: TerrainRegionComponent, mip: number, x: number, y: number, distance: number, height: number) {
    const key = pageKey(region, mip, x, y)
    let page = this.pages.get(key)
    if (!page) {
      page = { key, region, mip, x, y, slot: -1, lastUsed: 0, distance, selected: false, height, version: -1 }
      this.pages.set(key, page)
    } else if (page.region !== region) {
      // the region was reloaded, keep the slot but bake again with the new region data
      page.region = region
      page.version = -1
    }
    page.lastUsed = this.frame
    page.distance = distance
    page.height = height
    page.selected = false
    this.stats.requested++
    if (page.slot < 0 || page.version !== region.materialVersion) {
      this.pending.push(page)
    }
    return page
  }

  private makeResident() {
    // coarse pages first, so a fallback exists before the details arrive
    this.pending.sort((a, b) => b.mip - a.mip || a.distance - b.distance)

    let budget = this.bakeBudget
    let evictionSorted = false
    for (const page of this.pending) {
      if (budget <= 0) {
        break
      }
      if (!this.canBake(page.region)) {
        continue
      }
      if (page.slot >= 0) {
        // resident but stale
        this.bakePage(page)
        budget--
        continue
      }
      if (!this.freeSlots.length) {
        if (!evictionSorted) {
          // least recently used first, fine pages before coarse ones
          this.residentPages.sort((a, b) => a.lastUsed - b.lastUsed || a.mip - b.mip)
          evictionSorted = true
        }
        if (!this.evictOne()) {
          this.stats.overflow = this.pending.length - (this.bakeBudget - budget)
          break
        }
      }
      page.slot = this.freeSlots.pop()
      this.residentPages.push(page)
      this.bakePage(page)
      budget--
    }
    this.pending = this.pending.filter((it) => it.slot < 0 || it.version !== it.region.materialVersion)
  }

  private bakePage(page: TerrainPage) {
    const wasResident = page.version >= 0
    this.bake?.(page)
    page.version = page.region.materialVersion
    if (!wasResident) {
      this.onResidencyChange?.(page)
    }
  }

  private evictOne() {
    const victim = this.residentPages[0]
    if (!victim || victim.lastUsed === this.frame) {
      return false
    }
    this.residentPages.shift()
    this.freeSlots.push(victim.slot)
    victim.slot = -1
    victim.version = -1
    this.pages.delete(victim.key)
    this.onResidencyChange?.(victim)
    this.stats.evicted++
    return true
  }

  private forgetUnused() {
    // non resident pages that were not requested lately carry no state worth keeping
    for (const page of this.pages.values()) {
      if (page.slot < 0 && page.lastUsed !== this.frame) {
        this.pages.delete(page.key)
      }
    }
  }

  /**
   * Whether the page holds baked content, possibly of an older material version
   */
  public isResident(page: TerrainPage) {
    return page.slot >= 0 && page.version >= 0
  }

  /**
   * The resident page at the given address, if any
   */
  public findResident(region: TerrainRegionComponent, mip: number, x: number, y: number): TerrainPage | null {
    const page = this.pages.get(pageKey(region, mip, x, y))
    return page && page.region === region && page.slot >= 0 && page.version >= 0 ? page : null
  }

  /**
   * All resident pages of a region
   */
  public residentOf(region: TerrainRegionComponent): TerrainPage[] {
    return this.residentPages.filter((it) => it.region === region && it.version >= 0)
  }
}

/**
 * Numeric page key: region grid index (< 16 per axis), mip (< 8), page x/y (< 1024 at mip 0)
 */
function pageKey(region: TerrainRegionComponent, mip: number, x: number, y: number) {
  return (((region.xIndex * 16 + region.yIndex) * 8 + mip) * 1024 + x) * 1024 + y
}
