import { Device, type SurfaceFormat, type Texture, type WebGpuDevice, type WebGpuTexture } from '@gglib/graphics'
import { INDIRECTION_REGION_SLOTS } from './TerrainIndirection'
import type { TerrainRegionComponent } from './TerrainRegionComponent'

const MACRO_SIZE = 2048
const MACRO_MIPS = 10 // down to 4x4, the smallest block

const MAPS = [
  { name: 'VTMacroColor', format: 'bc1-rgba-unorm-srgb', get: (r: TerrainRegionComponent) => r.macroMaps?.color },
  { name: 'VTMacroNormal', format: 'bc5-rg-snorm', get: (r: TerrainRegionComponent) => r.macroMaps?.normal },
  { name: 'VTMacroGloss', format: 'bc4-r-unorm', get: (r: TerrainRegionComponent) => r.macroMaps?.gloss },
] as const

/**
 * Region macro textures (color, normal, gloss) copied into 2D arrays, one layer per indirection layer,
 * so the terrain draw can sample the macro maps of any loaded region.
 */
export class TerrainMacroArrays {
  public readonly textures: Texture[]

  private device: Device
  private copied: Array<TerrainRegionComponent | null> = new Array(INDIRECTION_REGION_SLOTS).fill(null)
  private warned = new Set<string>()

  public constructor(device: Device) {
    this.device = device
    this.textures = MAPS.map((map) =>
      device.createTexture({
        name: map.name,
        format: map.format as SurfaceFormat,
        type: '2d-array',
        width: MACRO_SIZE,
        height: MACRO_SIZE,
        depth: INDIRECTION_REGION_SLOTS,
        generateMipmap: false,
        mipLevelCount: MACRO_MIPS,
      }),
    )
  }

  /**
   * Whether the layer holds the macro maps of the region
   */
  public isReady(region: TerrainRegionComponent, layer: number) {
    return layer >= 0 && this.copied[layer] === region
  }

  /**
   * Copies the macro maps of the region into the layer, once the base material is loaded
   */
  public sync(region: TerrainRegionComponent, layer: number) {
    if (layer < 0 || this.copied[layer] === region || !region.macroMaps) {
      return
    }
    const sources = MAPS.map((map) => map.get(region) as WebGpuTexture)
    for (let i = 0; i < MAPS.length; i++) {
      const src = sources[i]
      if (!src || src.width !== MACRO_SIZE || src.height !== MACRO_SIZE || src.gpuObject.format !== MAPS[i].format) {
        if (!this.warned.has(region.regionName)) {
          this.warned.add(region.regionName)
          console.warn(
            'TerrainMacroArrays: unexpected macro texture',
            region.regionName,
            MAPS[i].name,
            src?.width,
            src?.gpuObject?.format,
          )
        }
        return
      }
    }
    const gpu = (this.device as WebGpuDevice).gpu
    const encoder = gpu.createCommandEncoder({ label: 'vt-macro-copy' })
    for (let i = 0; i < MAPS.length; i++) {
      const src = sources[i].gpuObject
      const dst = (this.textures[i] as WebGpuTexture).gpuObject
      const mips = Math.min(MACRO_MIPS, src.mipLevelCount)
      for (let mip = 0; mip < mips; mip++) {
        const size = MACRO_SIZE >> mip
        encoder.copyTextureToTexture(
          { texture: src, mipLevel: mip },
          { texture: dst, mipLevel: mip, origin: { x: 0, y: 0, z: layer } },
          { width: size, height: size, depthOrArrayLayers: 1 },
        )
      }
    }
    gpu.queue.submit([encoder.finish()])
    this.copied[layer] = region
  }

  public release(layer: number) {
    if (layer >= 0) {
      this.copied[layer] = null
    }
  }

  public dispose() {
    for (const texture of this.textures) {
      texture.dispose()
    }
  }
}
