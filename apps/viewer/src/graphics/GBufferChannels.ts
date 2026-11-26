import { TextureUsage, type TextureDescriptor } from '@gglib/graphics'
import { renderChannel, type RenderChannel } from '@gglib/render'

type TextureFormat = TextureDescriptor['format']

/**
 * Render channels of the GBuffer (layout in material/gbuffer.wgsl.ts)
 */
export const GBufferChannel = {
  /**
   * Octahedral normal (rg), transmittance luma (b), lighting model (a)
   */
  A: renderChannel('nw_gbuffer_a'),
  /**
   * sqrt(albedo) (rgb), occlusion (a)
   */
  B: renderChannel('nw_gbuffer_b'),
  /**
   * Smoothness (r), reflectance YCbCr (gba) or transmittance chroma (ba)
   */
  C: renderChannel('nw_gbuffer_c'),
}

const FORMAT_A: TextureFormat = 'rgb10a2unorm'
const FORMAT_BC: TextureFormat = 'rgba8unorm'

function descriptor(name: string, format: TextureFormat): Readonly<TextureDescriptor> {
  return {
    name,
    type: '2d',
    format,
    width: 1,
    height: 1,
    depth: 1,
    sampleCount: 1,
    mipLevelCount: 1,
    usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
  }
}

/**
 * Descriptors of all GBuffer channels, to be registered on the frame graph by the passes that write them
 */
export const GBUFFER_DESCRIPTORS: Record<RenderChannel, Readonly<TextureDescriptor>> = {
  [GBufferChannel.A]: descriptor('GBufferChannel.A', FORMAT_A),
  [GBufferChannel.B]: descriptor('GBufferChannel.B', FORMAT_BC),
  [GBufferChannel.C]: descriptor('GBufferChannel.C', FORMAT_BC),
}
