import { BlendState, Color, DepthState, TextureUsage, type Device, type Program, type Texture } from '@gglib/graphics'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import type { TexturePreview } from './TexturePreview'
import {
  TEXTURE_PREVIEW_3D_WGSL,
  TEXTURE_PREVIEW_WGSL,
  TexturePreviewChannels,
  TexturePreviewProjection,
} from './TexturePreview.wgsl'

/**
 * Draws a {@link TexturePreview} into `RenderChannel.Color` at the output size: the only pass of the texture view
 * (no scene, no tone mapping).
 */
export class TexturePreviewPass implements RenderPass {
  public name: string = 'Texture Preview'
  public enabled = true
  /**
   * The texture to draw, nothing is drawn without one
   */
  public preview: TexturePreview | null = null

  private programs: { array?: Program; volume?: Program } = {}
  /**
   * Bound as the alpha texture of textures without one
   */
  private noAlpha: Texture | null = null
  private target: FrameResource

  // Float32Arrays: indexed writes, the gglib vec4() is an { x, y, z, w } object
  private placement = new Float32Array(4)
  private size = new Float32Array(4)
  private mode = new Float32Array(4)
  private rotation = new Float32Array(4)

  public constructor(device: Device) {
    device.ready.then(() => {
      const create = (name: string, source: string) =>
        device.createShaderModule({ name, wgsl: { source } }).program.clone()
      this.programs.array = create('Texture Preview', TEXTURE_PREVIEW_WGSL)
      this.programs.volume = create('Texture Preview 3D', TEXTURE_PREVIEW_3D_WGSL)
      this.noAlpha = device.createTexture({
        name: 'Texture Preview no alpha',
        type: '2d-array',
        format: 'rgba8unorm',
        width: 1,
        height: 1,
        depth: 1,
        mipLevelCount: 1,
        usage: TextureUsage.TextureBinding,
      })
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    frame.addPass(this)
    this.target = frame.write(RenderChannel.Color, { width: ctx.outputWidth, height: ctx.outputHeight })
  }

  public render(ctx: RenderContext): void {
    const pass = ctx.device.renderPass
    const target = this.target.texture
    const preview = this.preview?.isDisposed ? null : this.preview
    const program = preview?.info.volume ? this.programs.volume : this.programs.array

    pass.flush()
    pass.setDepthTarget(null)
    pass.setDepthState(DepthState.Disabled)
    pass.setRenderTarget(0, target)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.setViewportState(0, 0, target.width, target.height)
    if (preview && program?.isCompiled && this.noAlpha) {
      this.updateParams(preview, target.width, target.height)
      program.set('params.placement', this.placement)
      program.set('params.size', this.size)
      program.set('params.mode', this.mode)
      program.set('params.rotation', this.rotation)
      program.mustSet('tex', preview.texture)
      program.mustSet('alphaTex', preview.alpha ?? this.noAlpha)
      program.commit()
      pass.setProgram(program)
      pass.draw(3)
    } else {
      pass.setClearColor(0, Color.Black)
      pass.clear()
    }
    pass.submit()
    pass.setRenderTarget(0, null)
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private updateParams(preview: TexturePreview, width: number, height: number) {
    preview.viewWidth = width
    preview.viewHeight = height
    const { info, state } = preview
    const { x, y, scale } = preview.placement()
    const mip = clamp(Math.round(state.mip), 0, info.mips - 1)
    const layers = info.volume ? info.depth : info.layers
    this.placement[0] = Math.round(x)
    this.placement[1] = Math.round(y)
    this.placement[2] = scale
    this.placement[3] = scale
    this.size[0] = info.width
    this.size[1] = info.height
    this.size[2] = clamp(mip, 0, Math.max(preview.alphaMips - 1, 0))
    this.size[3] = preview.isProjected ? TexturePreviewProjection[state.projection] : 0
    this.rotation[0] = Math.cos(state.yaw)
    this.rotation[1] = Math.sin(state.yaw)
    this.rotation[2] = Math.cos(state.pitch)
    this.rotation[3] = Math.sin(state.pitch)
    this.mode[0] = mip
    this.mode[1] = clamp(Math.round(state.layer), 0, layers - 1)
    this.mode[2] = TexturePreviewChannels[state.channels]
    this.mode[3] = preview.flags
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
