import { BlendState, Color, Texture, TextureUsage, WebGpuTexture, type Device } from '@gglib/graphics'
import type { IVec4 } from '@gglib/math'
import { BC3Encoder } from '../../graphics'
import { SplatPackMaterial, type TerrainCompositeMaterial } from '../../material'
import type { TerrainMaterialLayer } from './TerrainRegionComponent'

/**
 * Bake target: array layer and the region / material uv transforms of the rendered area
 */
export interface TerrainTile {
  slot: { layer: number; pinned: boolean }
  macroUvTransform: IVec4
  colorUvTransform: IVec4
  renderVersion: number
}

export interface TileRendererOptions {
  width: number
  height: number
  /**
   * Mip levels of the staging targets and encoded output, defaults to 1
   */
  mipLevelCount?: number
}

export class TerrainTileRenderer {
  private device: Device

  private stagingMap1: Texture
  private stagingMap2: Texture
  private stagingMap3: Texture

  private combine: SplatPackMaterial
  private usedMaterials = new Set<TerrainCompositeMaterial>()
  private encoder: BC3Encoder

  public constructor(device: Device, options: TileRendererOptions) {
    this.device = device
    const width = options.width
    const height = options.height
    const mipLevelCount = options.mipLevelCount ?? 1
    if (width < 1 || height < 1) {
      throw new Error('width and height must be at least 1')
    }

    this.combine = new SplatPackMaterial(this.device, { properties: {} })
    this.encoder = new BC3Encoder(this.device, options)

    this.stagingMap1 = this.device.createTexture({
      format: 'rgba16float',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount,
    })
    this.stagingMap2 = this.device.createTexture({
      format: 'rgba16float',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount,
    })
    this.stagingMap3 = this.device.createTexture({
      format: 'rgba16float',
      width: width,
      height: height,
      usage: TextureUsage.TextureBinding | TextureUsage.RenderTarget,
      generateMipmap: false,
      mipLevelCount,
    })
  }

  public render(
    tile: TerrainTile,
    tileArrays: Texture[],
    baseMaterial: TerrainCompositeMaterial,
    baseSplat: Texture,
    layers: TerrainMaterialLayer[],
    /**
     * Binds region specific inputs (splat, macro maps and params) to a possibly shared material
     */
    bind: (material: TerrainCompositeMaterial, splat: Texture) => void,
  ) {
    //
    // 1. blend layers into intermediate maps
    //
    const pass = this.device.renderPass
    pass.flush()
    this.bindStagingTargets()
    pass.setClearColor(0, Color.White) // base color
    pass.setClearColor(1, Color.Black)
    pass.setClearColor(2, Color.LimeGreen) // normal
    pass.clear()

    const used = this.usedMaterials
    used.clear()
    const draw = (material: TerrainCompositeMaterial, splat: Texture) => {
      if (used.has(material)) {
        // same material instance with other inputs in this bake, submit the previous draws first.
        // flush resets the encoder state, bind the targets again (loaded, not cleared)
        pass.flush()
        this.bindStagingTargets()
      }
      used.add(material)
      bind(material, splat)
      material.RegionScaleOffset = tile.macroUvTransform
      material.TilingScaleOffset = tile.colorUvTransform
      material.effect.applyInputs(material.inputBlocks)
      material.effect.program.commit()
      pass.setProgram(material.effect.program)
      pass.draw(3)
    }

    if (baseMaterial) {
      draw(baseMaterial, baseSplat)
    }
    for (const layer of layers || []) {
      draw(layer.material, layer.splat)
    }

    pass.flush()

    //
    // 2. generate mipmaps, so we can encode them individually in the next step
    //

    this.stagingMap1.updateMipmaps()
    this.stagingMap2.updateMipmaps()
    this.stagingMap3.updateMipmaps()
    pass.flush()

    //
    // 3. pack and encode
    //

    for (let mipLevel = 0; mipLevel < this.stagingMap1.mipLevelCount; mipLevel++) {
      const mipResolution = this.stagingMap1.width >> mipLevel

      // texture 1
      // rgb = sqrt(base color) for better precision in the darks, decoded with x*x
      //
      this.encoder.encode(
        this.stagingMap1, // take RGB
        this.stagingMap3, // take R as alpha
        tileArrays[0] as WebGpuTexture,
        tile.slot.layer,
        mipResolution,
        mipLevel,
        1.0, // rgbScale
        'r', // alphaSelector
        true, // sqrtEncode
      )

      pass.flush()
    }

    for (let mipLevel = 0; mipLevel < this.stagingMap1.mipLevelCount; mipLevel++) {
      const mipResolution = this.stagingMap1.width >> mipLevel

      this.encoder.encode(
        this.stagingMap2, // take RGB
        this.stagingMap3, // take G as alpha
        tileArrays[1] as WebGpuTexture,
        tile.slot.layer,
        mipResolution,
        mipLevel,
        1.0, // rgbScale
        'g', // alphaSelector
      )
      pass.flush()
    }
  }

  private bindStagingTargets() {
    const pass = this.device.renderPass
    pass.setRenderTarget(0, this.stagingMap1)
    pass.setRenderTarget(1, this.stagingMap2)
    pass.setRenderTarget(2, this.stagingMap3)
    pass.setRenderBlend(0, BlendState.AlphaPremultiplied)
    pass.setRenderBlend(1, BlendState.AlphaPremultiplied)
    pass.setRenderBlend(2, BlendState.AlphaPremultiplied)
    pass.setViewportState(0, 0, this.stagingMap1.width, this.stagingMap1.height)
  }

  public dispose() {
    this.stagingMap1.dispose()
    this.stagingMap2.dispose()
    this.stagingMap3.dispose()

    this.combine.dispose()
    this.encoder.dispose()
  }
}
