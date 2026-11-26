/**
 * Tract lookup at world positions from the region tractmaps (`/levels/{level}/{region}/tractmap.bin`).
 * Tract indices are region local, the names come with the region `info.json`.
 */
export class TractLookup {
  private regions = new Map<string, Promise<RegionTracts | null>>()
  private loaded = new Map<string, RegionTracts | null>()

  private baseUrl: string
  private level: string
  private regionSize: number
  /**
   * called when a region finished loading, lookups may return a tract now
   */
  public onLoad: () => void = () => {}

  public constructor(baseUrl: string, level: string, regionSize: number) {
    this.baseUrl = baseUrl
    this.level = level
    this.regionSize = regionSize
  }

  /**
   * Tract name at the world position, null while the region is loading or outside of the map
   */
  public tractAt(x: number, y: number): string | null {
    const rx = Math.floor(x / this.regionSize)
    const ry = Math.floor(y / this.regionSize)
    if (rx < 0 || ry < 0) {
      return null
    }
    const name = regionName(rx, ry)
    if (!this.regions.has(name)) {
      const task = this.load(name)
      this.regions.set(name, task)
      task.then((it) => {
        this.loaded.set(name, it)
        this.onLoad()
      })
      return null
    }
    const region = this.loaded.get(name)
    if (!region) {
      return null
    }
    const size = region.size
    // image order like the heightmap: row 0 at the region max y
    const px = Math.min(size - 1, Math.max(0, Math.floor(((x - rx * this.regionSize) / this.regionSize) * size)))
    const py = Math.min(
      size - 1,
      Math.max(0, Math.floor(((ry * this.regionSize + this.regionSize - y) / this.regionSize) * size)),
    )
    const index = region.indices[py * size + px]
    return index === 255 ? null : (region.names[index] ?? null)
  }

  private async load(name: string): Promise<RegionTracts | null> {
    try {
      const [info, map] = await Promise.all([
        fetch(`${this.baseUrl}/levels/${this.level}/${name}/info.json`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${this.baseUrl}/levels/${this.level}/${name}/tractmap.bin`).then((r) => (r.ok ? r.arrayBuffer() : null)),
      ])
      if (!info?.tracts || !map) {
        return null
      }
      const indices = new Uint8Array(map)
      return { names: info.tracts, indices, size: Math.round(Math.sqrt(indices.length)) }
    } catch {
      return null
    }
  }
}

interface RegionTracts {
  names: string[]
  indices: Uint8Array
  size: number
}

function regionName(x: number, y: number) {
  return `r_+${String(x).padStart(2, '0')}_+${String(y).padStart(2, '0')}`
}
