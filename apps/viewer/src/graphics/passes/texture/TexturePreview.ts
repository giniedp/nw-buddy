import {
  surfaceFormatFromDXGI,
  surfaceFormatInfo,
  TextureSource,
  TextureUsage,
  type CompressedFaceData,
  type Device,
  type SurfaceFormat,
  type Texture,
} from '@gglib/graphics'
import { DDS } from '@gglib/loaders'
import { TexturePreviewFlag, type TexturePreviewChannels, type TexturePreviewProjection } from './TexturePreview.wgsl'

/**
 * What a preview shows, read from the DDS header
 */
export interface TexturePreviewInfo {
  /**
   * The DXGI format name without its prefix, e.g. `BC7_UNORM_SRGB`
   */
  formatName: string
  format: SurfaceFormat
  width: number
  height: number
  mips: number
  /**
   * Array layers: 6 for a cubemap, 1 otherwise
   */
  layers: number
  /**
   * Depth slices of a volume texture, 1 otherwise
   */
  depth: number
  cubemap: boolean
  volume: boolean
  /**
   * The alpha comes from the attached `.dds.a`
   */
  alphaTexture: boolean
  /**
   * A two channel normal map whose z is reconstructed
   */
  normalMap: boolean
  /**
   * The values are linear (sRGB or float format): encoded for the display unless turned off
   */
  linear: boolean
}

/**
 * How a preview is drawn
 */
export interface TexturePreviewState {
  mip: number
  /**
   * Cube face or array layer, the depth slice (of mip 0) of a volume
   */
  layer: number
  channels: TexturePreviewChannels
  /**
   * Encode the values for the display (linear data)
   */
  encode: boolean
  /**
   * Target pixels per texel of mip 0, null to fit the texture into the view
   */
  scale: number | null
  /**
   * Offset of the texture from the centered position, in target pixels
   */
  panX: number
  panY: number
  /**
   * How a cubemap is shown: one face (`layer`), or mapped onto a sphere or a cube
   */
  projection: TexturePreviewProjection
  /**
   * Rotation of the sphere or cube, radians
   */
  yaw: number
  pitch: number
}

export interface TexturePreviewOptions {
  name: string
  /**
   * The texture as a plain DDS file (split textures assembled)
   */
  color: Uint8Array
  /**
   * The attached alpha texture `.dds.a` as a plain DDS file
   */
  alpha?: Uint8Array | null
  /**
   * The file is a normal map (`_ddn`, `_ddna`): a two channel format gets its z reconstructed
   */
  normalMap?: boolean
}

const MIN_SCALE = 1 / 64
const MAX_SCALE = 64

/**
 * A texture uploaded for the texture preview, with the state it is drawn with, see {@link TexturePreviewPass}
 */
export class TexturePreview {
  public readonly info: TexturePreviewInfo
  public readonly state: TexturePreviewState
  public readonly texture: Texture
  public readonly alpha: Texture | null
  /**
   * Mips of the alpha texture
   */
  public readonly alphaMips: number
  /**
   * Size of the view the preview was last drawn into, in target pixels
   */
  public viewWidth = 1
  public viewHeight = 1

  private readonly alphaInRed: boolean
  private disposed = false

  public constructor(device: Device, options: TexturePreviewOptions) {
    const color = uploadDds(device, options.color, `${options.name}`)
    this.texture = color.texture
    const alpha = options.alpha ? uploadDds(device, options.alpha, `${options.name}.a`) : null
    this.alpha = alpha?.texture ?? null
    this.alphaMips = alpha?.dds.images.length ?? 0
    this.alphaInRed = !!alpha && surfaceFormatInfo(alpha.format).components === 1

    const dds = color.dds
    const name = color.format
    const components = surfaceFormatInfo(name).components
    const linear = surfaceFormatInfo(name).srgb || name.includes('float') || name.startsWith('bc6h')
    this.info = {
      formatName: (DDS.DXGI_FORMAT[dds.format] ?? String(dds.format)).replace(/^DXGI_FORMAT_/, ''),
      format: name,
      width: dds.width,
      height: dds.height,
      mips: dds.images.length,
      layers: dds.isCubemap ? 6 : 1,
      depth: dds.isVolume ? dds.depth : 1,
      cubemap: dds.isCubemap,
      volume: dds.isVolume,
      alphaTexture: !!this.alpha,
      normalMap: !!options.normalMap && components === 2,
      linear,
    }
    this.state = {
      mip: 0,
      layer: 0,
      channels: 'rgba',
      encode: linear,
      scale: null,
      panX: 0,
      panY: 0,
      projection: 'faces',
      yaw: 0,
      pitch: 0,
    }
  }

  /**
   * Whether the cubemap is drawn onto a sphere or a cube: dragging rotates it
   */
  public get isProjected(): boolean {
    return this.info.cubemap && this.state.projection !== 'faces'
  }

  /**
   * Rotates a projected cubemap by fractions of the view: a drag across the view turns it half around
   */
  public rotateBy(fx: number, fy: number) {
    this.state.yaw -= fx * Math.PI
    this.state.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.state.pitch - fy * Math.PI))
  }

  public resetRotation() {
    this.state.yaw = 0
    this.state.pitch = 0
  }

  /**
   * The `FLAG_*` bits of the shader for the current state
   */
  public get flags(): number {
    const info = this.info
    let flags = 0
    if (this.state.encode) {
      flags |= TexturePreviewFlag.Encode
    }
    if (info.normalMap) {
      flags |= TexturePreviewFlag.NormalZ
    }
    if (info.format.includes('snorm')) {
      flags |= TexturePreviewFlag.Signed
    }
    if (surfaceFormatInfo(info.format).components === 1) {
      flags |= TexturePreviewFlag.Single
    }
    if (this.alpha) {
      flags |= TexturePreviewFlag.AlphaTexture
      if (this.alphaInRed) {
        flags |= TexturePreviewFlag.AlphaInRed
      }
    }
    return flags
  }

  /**
   * Top left of the texture in the view and the target pixels per texel of mip 0
   */
  public placement(viewWidth = this.viewWidth, viewHeight = this.viewHeight) {
    const { width, height } = this.info
    const scale = this.state.scale ?? Math.min(viewWidth / width, viewHeight / height)
    return {
      x: (viewWidth - width * scale) / 2 + this.state.panX,
      y: (viewHeight - height * scale) / 2 + this.state.panY,
      scale,
    }
  }

  /**
   * Fits the texture into the view
   */
  public fit() {
    this.state.scale = null
    this.state.panX = 0
    this.state.panY = 0
  }

  /**
   * One texel of mip 0 per target pixel, centered
   */
  public actualSize() {
    this.state.scale = 1
    this.state.panX = 0
    this.state.panY = 0
  }

  /**
   * Zooms by a factor, keeping the texel under the given point (fractions of the view) in place
   */
  public zoomAt(fx: number, fy: number, factor: number) {
    const w = this.viewWidth
    const h = this.viewHeight
    const { x, y, scale } = this.placement()
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
    const px = fx * w
    const py = fy * h
    const nx = px - ((px - x) * next) / scale
    const ny = py - ((py - y) * next) / scale
    this.state.scale = next
    this.state.panX = nx - (w - this.info.width * next) / 2
    this.state.panY = ny - (h - this.info.height * next) / 2
  }

  /**
   * Moves the texture by fractions of the view
   */
  public panBy(fx: number, fy: number) {
    this.state.panX += fx * this.viewWidth
    this.state.panY += fy * this.viewHeight
  }

  public dispose() {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.texture.dispose()
    this.alpha?.dispose()
  }

  public get isDisposed() {
    return this.disposed
  }
}

/**
 * Uploads a DDS file as stored: a 2d array (6 layers for a cubemap, so every face can be read with textureLoad) or a
 * 3d texture
 */
function uploadDds(device: Device, bytes: Uint8Array, name: string) {
  const buffer =
    bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes.buffer : bytes.slice().buffer
  const dds = DDS.parse(buffer as ArrayBuffer)
  const format = surfaceFormatFromDXGI(dds.format)
  if (format == null || !device.capabilities.isFormatSupported(format)) {
    const formatName = DDS.DXGI_FORMAT[dds.format] ?? dds.format
    throw new Error(`The format ${formatName} is not supported`)
  }
  if (dds.residentMipLevel > 0) {
    throw new Error(`The file lacks ${dds.residentMipLevel} large mips`)
  }
  const layers = dds.isCubemap ? 6 : 1
  const levels: CompressedFaceData[][] = dds.images.map((level) => level.faces.slice(0, layers))
  const texture = device.createTexture({
    name: `Preview ${name}`,
    type: dds.isVolume ? '3d' : '2d-array',
    format,
    width: dds.width,
    height: dds.height,
    depth: dds.isVolume ? dds.depth : layers,
    mipLevelCount: dds.images.length,
    generateMipmap: false,
    usage: TextureUsage.TextureBinding,
    source: new TextureSource({
      width: dds.width,
      height: dds.height,
      depth: dds.isVolume ? dds.depth : layers,
      levels,
    }),
  })
  return { dds, format, texture }
}
