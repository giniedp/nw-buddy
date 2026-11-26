import { Device, type Texture, type WebGpuDevice, type WebGpuTexture } from '@gglib/graphics'
import { vec4, vec4$init } from '@gglib/math'
import type { MacroMaterialParams } from '../../api'
import { VT_PAGE_SIZE } from '../../constants'
import type { TerrainCompositeMaterial } from '../../material'
import type { TerrainMaterialLayer, TerrainRegionComponent } from './TerrainRegionComponent'
import { pageWorldSize, type TerrainPage } from './TerrainPages'
import { TerrainTileRenderer, type TerrainTile } from './TerrainTileRenderer'

const SUB_TILE_SIZE = 256

/**
 * Physical cache of the terrain virtual texture.
 *
 * Two BC3 2D arrays, one layer per page, single mip:
 * - map1: rgb = sqrt(albedo), a = normal.x
 * - map2: rgb = (smoothness, specular, normal.y), a = height
 *
 * Pages are baked with shared edges: the first and last texel centers lie exactly on the page border,
 * so neighbouring pages hold identical edge texels and clamped bilinear sampling is continuous across pages.
 */
export class TerrainPageTextures {
  public readonly textures: Texture[]
  public readonly capacity: number

  /**
   * Skip layers that do not affect the sub tile of a page (regionmat affectedTiles)
   */
  public cullLayers = true

  private device: Device
  private renderer: TerrainTileRenderer
  private layers: TerrainMaterialLayer[] = []
  private whitePixel: Texture
  private tile: TerrainTile = {
    slot: { layer: 0, pinned: false },
    macroUvTransform: vec4(1, 1, 0, 0),
    colorUvTransform: vec4(1, 1, 0, 0),
    renderVersion: 0,
  }

  /**
   * @param whitePixel - splat of the base material, which covers the whole page
   */
  public constructor(device: Device, capacity: number, whitePixel: Texture) {
    this.device = device
    this.whitePixel = whitePixel
    this.capacity = capacity
    this.textures = ['VTPages1', 'VTPages2'].map((name) =>
      device.createTexture({
        name,
        format: 'bc3-rgba-unorm',
        type: '2d-array',
        width: VT_PAGE_SIZE,
        height: VT_PAGE_SIZE,
        depth: capacity,
        generateMipmap: false,
        mipLevelCount: 1,
      }),
    )
    this.renderer = new TerrainTileRenderer(device, {
      width: VT_PAGE_SIZE,
      height: VT_PAGE_SIZE,
      mipLevelCount: 1,
    })
  }

  public bake(page: TerrainPage) {
    const region = page.region
    const size = pageWorldSize(page.mip)
    const minX = region.origin.x + page.x * size
    const minY = region.origin.y + page.y * size

    // shared edges: texel i is centered at min + i * step
    const step = size / (VT_PAGE_SIZE - 1)
    const span = VT_PAGE_SIZE * step
    const worldMinX = minX - step * 0.5
    const worldMinY = minY - step * 0.5

    const tile = this.tile
    tile.slot = { layer: page.slot, pinned: false }
    // material uv in meters, the material applies its own tiling
    vec4$init(tile.colorUvTransform, span, span, worldMinX, worldMinY)
    // region uv, v is flipped
    const regionSize = region.size
    vec4$init(
      tile.macroUvTransform,
      span / regionSize,
      -span / regionSize,
      (worldMinX - region.origin.x) / regionSize,
      1 - (worldMinY - region.origin.y) / regionSize,
    )

    const macro = region.macroMaps
    const params = foregroundParams(region)
    this.renderer.render(
      tile,
      this.textures,
      region.baseMaterial,
      this.whitePixel,
      this.layersFor(page, minX, minY),
      (material, splat) => {
        // materials are shared between regions, bind the region inputs right before the draw
        material.SplatMap = splat
        material.MacroBaseMap = macro.color
        material.MacroNormalMap = macro.normal
        material.MacroGlossMap = macro.gloss
        applyMacroParams(material, params)
      },
    )
  }

  private layersFor(page: TerrainPage, minX: number, minY: number) {
    const all = page.region.layers
    if (!this.cullLayers || !all?.length) {
      return all
    }
    // a page never crosses a sub tile, the largest page is one sub tile
    const region = page.region
    const column = Math.floor((minX - region.origin.x) / SUB_TILE_SIZE)
    const row = region.size / SUB_TILE_SIZE - 1 - Math.floor((minY - region.origin.y) / SUB_TILE_SIZE)
    const bit = BigInt(row * (region.size / SUB_TILE_SIZE) + column)
    this.layers.length = 0
    for (const layer of all) {
      if ((layer.affectedTiles >> bit) & 1n) {
        this.layers.push(layer)
      }
    }
    return this.layers
  }

  /**
   * Reads the raw BC3 blocks of a page, for debugging
   */
  public async readPage(slot: number, map: 0 | 1): Promise<Uint8Array> {
    const gpu = (this.device as WebGpuDevice).gpu
    const bytesPerRow = (VT_PAGE_SIZE / 4) * 16
    const rows = VT_PAGE_SIZE / 4
    const buffer = gpu.createBuffer({
      usage: 8 | 1, // COPY_DST | MAP_READ
      size: bytesPerRow * rows,
    })
    const encoder = gpu.createCommandEncoder()
    encoder.copyTextureToBuffer(
      { texture: (this.textures[map] as WebGpuTexture).gpuObject, mipLevel: 0, origin: { x: 0, y: 0, z: slot } },
      { buffer, bytesPerRow, rowsPerImage: rows },
      { width: VT_PAGE_SIZE, height: VT_PAGE_SIZE, depthOrArrayLayers: 1 },
    )
    gpu.queue.submit([encoder.finish()])
    await buffer.mapAsync(1) // READ
    const result = new Uint8Array(buffer.getMappedRange().slice(0))
    buffer.unmap()
    buffer.destroy()
    return result
  }

  public dispose() {
    for (const texture of this.textures) {
      texture.dispose()
    }
    this.renderer.dispose()
  }
}

/**
 * Macro params of the compositing pass.
 * Lumberyard binds the region macro material (TerrainCompositer_Render.cpp BindMacroMaterialShaderConstants).
 * NW adds world foreground/background params with per region overrides, the terrain draw binds the
 * background params (GPA capture), so the compositing pass is assumed to use the foreground params.
 */
function foregroundParams(region: TerrainRegionComponent): MacroMaterialParams | undefined {
  const data = region.materialData
  return data?.customForegroundParams ?? data?.worldForegroundParams ?? data?.macroMaterialParams
}

const macroColor = vec4()
function applyMacroParams(material: TerrainCompositeMaterial, params: MacroMaterialParams | undefined) {
  const color = params?.color ?? [1, 1, 1, 1]
  const colorScale = params?.colorScale ?? 1
  vec4$init(macroColor, color[0] * colorScale, color[1] * colorScale, color[2] * colorScale, color[3])
  material.MacroColor = macroColor
  material.MacroGlossScale = params?.glossScale ?? 1
  material.MacroNormalScale = Math.max(params?.normalScale ?? 1, 0.001)
}
