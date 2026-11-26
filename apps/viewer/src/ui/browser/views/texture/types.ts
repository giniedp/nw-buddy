import type { AssembledDds } from '../../../../formats/dds/assemble'
import type {
  TexturePreviewChannels,
  TexturePreviewProjection,
} from '../../../../graphics/passes/texture/TexturePreview.wgsl'

/**
 * A texture of the pak, reassembled from its split files
 */
export interface DdsTexture {
  /**
   * The texture itself: `x.dds`, or `x.dds.a` when the alpha file was opened
   */
  color: AssembledDds
  /**
   * The attached alpha texture `x.dds.a` of `x.dds`, null if there is none or it was opened itself
   */
  alpha: AssembledDds | null
}

/**
 * What the toolbar tells about a texture, from the header of the assembled file
 */
export interface TextureFacts {
  formatName: string
  width: number
  height: number
  mips: number
  depth: number
  cubemap: boolean
  volume: boolean
  linear: boolean
  parts: number
  dropped: number
  alpha: boolean
  normalMap: boolean
}

/**
 * The state of the texture mode. The view reads it, the store actions change it.
 */
export interface TextureModeState {
  mip: number
  layer: number
  channels: TexturePreviewChannels
  /**
   * Cubemaps: one face at a time, or on a sphere or a cube
   */
  projection: TexturePreviewProjection
  /**
   * Encode linear values for the display, null follows the format
   */
  encode: boolean | null
  /**
   * The texture was assembled but the engine could not create it
   */
  error: string | null
  /**
   * The texture could not be assembled
   */
  readonly loadError: string | null
  /**
   * Null while the texture is assembled, and when it could not be
   */
  readonly facts: TextureFacts | null
  /**
   * Whether the values are encoded for the display: `encode`, or what the format says
   */
  readonly encoded: boolean
  /**
   * The layers the layer slider scrubs, 1 hides it
   */
  readonly layers: number
  /**
   * The name of a layer: a cubemap face or a volume slice
   */
  readonly layerLabel: string
  /**
   * The size of the shown mip, e.g. `512×256`
   */
  readonly mipSize: string
  /**
   * The facts of the texture as one line
   */
  readonly info: string
}
