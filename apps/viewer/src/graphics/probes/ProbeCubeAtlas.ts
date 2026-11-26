import {
  TextureUsage,
  type Device,
  type SurfaceFormat,
  type Texture,
  type TextureSource,
  type WebGpuTexture,
} from '@gglib/graphics'

/**
 * Number of cubes the atlas can hold, like the engine (D3DTiledShading.cpp: AtlasArrayDim).
 * About 50 distinct cubes ship with the game, so there is no need to evict.
 */
export const PROBE_ATLAS_SLOTS = 64
export const PROBE_SPECULAR_SIZE = 256
export const PROBE_SPECULAR_MIPS = 7
export const PROBE_DIFFUSE_SIZE = 32

const CUBE_FACES = 6

export interface ProbeCubeAtlasOptions {
  /**
   * Default `bc6h-rgb-ufloat`, the format of the game's cubes. `rgb9e5ufloat` works on devices without BC
   */
  format?: SurfaceFormat
  /**
   * Default {@link PROBE_ATLAS_SLOTS}
   */
  slots?: number
}

/**
 * The data of a cube as loaded, with its format
 */
export interface ProbeCubeTexture {
  source: TextureSource
  format: SurfaceFormat
}

/**
 * GPU storage of the baked environment probe cubes: one cube array for specular and one for diffuse,
 * a slot index addresses the same cube in both.
 *
 * @remarks
 * Holds no knowledge about files, probes or loading. Slots live as long as the atlas (a level change keeps them),
 * because the cubes are shared between levels and regions.
 */
export class ProbeCubeAtlas {
  public readonly specular: Texture
  public readonly diffuse: Texture
  /**
   * The format of both cube arrays, cubes of other formats are rejected
   */
  public readonly format: SurfaceFormat
  /**
   * Number of cubes the atlas holds
   */
  public readonly size: number

  private slots = new Map<string, number>()

  public get usedSlots() {
    return this.slots.size
  }

  public constructor(device: Device, options: ProbeCubeAtlasOptions = {}) {
    this.format = options.format ?? 'bc6h-rgb-ufloat'
    this.size = options.slots ?? PROBE_ATLAS_SLOTS
    this.specular = device.createTexture({
      name: 'Probe Atlas Specular',
      type: 'cube-array',
      width: PROBE_SPECULAR_SIZE,
      height: PROBE_SPECULAR_SIZE,
      depth: this.size * CUBE_FACES,
      mipLevelCount: PROBE_SPECULAR_MIPS,
      format: this.format,
      usage: TextureUsage.TextureBinding,
    })
    this.diffuse = device.createTexture({
      name: 'Probe Atlas Diffuse',
      type: 'cube-array',
      width: PROBE_DIFFUSE_SIZE,
      height: PROBE_DIFFUSE_SIZE,
      depth: this.size * CUBE_FACES,
      mipLevelCount: 1,
      format: this.format,
      usage: TextureUsage.TextureBinding,
    })
  }

  /**
   * Gets the slot of the given key, assigns a new one if needed
   *
   * @returns the slot index or -1 if the atlas is full
   */
  public acquire(key: string): number {
    let slot = this.slots.get(key)
    if (slot === undefined) {
      if (this.slots.size >= this.size) {
        return -1
      }
      slot = this.slots.size
      this.slots.set(key, slot)
    }
    return slot
  }

  /**
   * Uploads the cubes of a slot. Like the engine (CTiledShading::InsertTexture) a cube is rejected
   * unless it has the exact size and mip count of the atlas, and here its format.
   *
   * @returns whether the cubes were uploaded
   */
  public upload(slot: number, specular: ProbeCubeTexture, diffuse: ProbeCubeTexture): boolean {
    if (specular.format !== this.format || diffuse.format !== this.format) {
      return false
    }
    if (
      !matches(specular.source, PROBE_SPECULAR_SIZE, PROBE_SPECULAR_MIPS) ||
      !matches(diffuse.source, PROBE_DIFFUSE_SIZE, 1)
    ) {
      return false
    }
    const layer = slot * CUBE_FACES
    ;(this.specular as WebGpuTexture).setLayerDataFromSource(specular.source, layer)
    ;(this.diffuse as WebGpuTexture).setLayerDataFromSource(diffuse.source, layer)
    return true
  }

  public dispose() {
    this.specular.dispose()
    this.diffuse.dispose()
  }
}

function matches(source: TextureSource, size: number, mips: number) {
  return (
    source.width === size &&
    source.height === size &&
    source.levels.length === mips &&
    source.levels.every((level) => level.length === CUBE_FACES)
  )
}
