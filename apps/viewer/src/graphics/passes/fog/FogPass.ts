import { BlendState, SamplerState, type Device, type InputValueType, type Program, type Texture } from '@gglib/graphics'
import { mat4Identity, mat4Invert } from '@gglib/math'
import { FrameGraph, RenderChannel, type FrameResource, type RenderContext, type RenderPass } from '@gglib/render'
import { InputSlots } from '../../../material/common'
import { FOG_WGSL } from './FogPass.wgsl'
import type { FroxelFogPass } from './FroxelFogPass'

export interface FogPassOptions {
  enabled?: boolean
  /**
   * Color channel to apply fog to (modified in place). Defaults to {@link RenderChannel.Color}
   */
  color?: RenderChannel
  /**
   * Linear view space depth channel with the size of the color channel. Defaults to {@link RenderChannel.LinearDepth}
   */
  depth?: RenderChannel
  /**
   * Froxel volumetric fog, sampled up to the ray-marching range when it rendered this frame (FogPassPS). Without it
   * the near range is analytical.
   */
  froxel?: FroxelFogPass
}

/**
 * `dst = src.rgb + dst.rgb * src.a`, keeps destination alpha
 */
const FOG_BLEND = BlendState.get({
  enable: true,
  colorBlendFunction: 'add',
  colorSrcBlend: 'one',
  colorDstBlend: 'src-alpha',
  alphaBlendFunction: 'add',
  alphaSrcBlend: 'zero',
  alphaDstBlend: 'one',
})

/**
 * Applies volumetric fog to opaque geometry (deferred).
 *
 * Opaque materials skip fog while {@link InputSlots.Global.SkipFog} is set, so fog is applied
 * after screen space effects (e.g. ambient occlusion) and before transparent geometry.
 * Like the game's FogPassPS every pixel is fogged: the sky and the background at the far plane (the sky skips its own
 * fog while SkipFog is set). With the froxel pass, the near range up to the ray-marching range comes from its volume.
 */
export class FogPass implements RenderPass {
  public name: string = 'Fog'
  public enabled = true

  private color: RenderChannel
  private depth: RenderChannel
  private program: Program
  private isActive = false

  private colorResource: FrameResource
  private depthResource: FrameResource

  private froxel: FroxelFogPass | null
  /**
   * Bound while the froxel volume is off, the shader does not read it
   */
  private emptyVolume: Texture
  private froxelEnabled = new Float32Array(4)

  private ndcToView = new Float32Array(4)
  private cameraWorld = mat4Identity()
  private viewport = new Float32Array(4)
  private depthRange = new Float32Array(4)

  private get isReady() {
    return !!this.program?.isCompiled
  }

  public constructor(device: Device, options?: FogPassOptions) {
    this.enabled = options?.enabled ?? this.enabled
    this.color = options?.color ?? RenderChannel.Color
    this.depth = options?.depth ?? RenderChannel.LinearDepth
    this.froxel = options?.froxel ?? null
    device.ready.then(() => {
      this.emptyVolume = device.createTexture({
        name: 'Fog empty froxel volume',
        type: '3d',
        format: 'rgba16float',
        width: 1,
        height: 1,
        depth: 1,
        mipLevelCount: 1,
        generateMipmap: false,
      })
      this.program = device
        .createShaderModule({
          name: 'NW Fog',
          wgsl: { source: FOG_WGSL },
        })
        .program.clone()
    })
  }

  public setup(frame: FrameGraph<RenderPass>, ctx: RenderContext): void {
    this.isActive = this.enabled && this.isReady
    if (!this.isActive) {
      return
    }
    frame.addPass(this)
    this.depthResource = frame.read(this.depth)
    this.colorResource = frame.modifyInPlace(this.color)
  }

  public render(ctx: RenderContext): void {
    if (!this.isActive) {
      return
    }

    const pass = ctx.device.renderPass
    pass.flush()

    this.updateParams(ctx)
    const color = this.colorResource.texture
    const program = this.program
    this.setParams(ctx, program)
    program.mustSet('depthMap', this.depthResource.texture)
    program.commit()

    pass.setRenderTarget(0, color)
    pass.setRenderBlend(0, FOG_BLEND)
    pass.setViewportState(0, 0, color.width, color.height)
    pass.setProgram(program)
    pass.draw(3)
    pass.submit()
    pass.flush()
  }

  public cleanup(ctx: RenderContext): void {
    //
  }

  private updateParams(ctx: RenderContext) {
    const camera = ctx.view.camera
    const proj = camera.projection
    const width = ctx.viewWidth
    const height = ctx.viewHeight

    // right handed view space, looking down -z
    this.ndcToView[0] = 2 / proj[0]
    this.ndcToView[1] = -2 / proj[5]
    this.ndcToView[2] = (proj[8] - 1) / proj[0]
    this.ndcToView[3] = (proj[9] + 1) / proj[5]

    this.viewport[0] = width
    this.viewport[1] = height
    this.viewport[2] = 1 / width
    this.viewport[3] = 1 / height

    this.depthRange[0] = camera.far * 0.99
    this.depthRange[1] = camera.far
  }

  private setParams(ctx: RenderContext, program: Program) {
    const inputs = ctx.renderInputs
    // view to world: the inverse of the view matrix. The camera entity transform (camera.world) is not the same,
    // the view matrix adds the rotation from the Z-up world into the view space looking down -z.
    program.set('params.cameraWorld', mat4Invert(ctx.view.camera.view, this.cameraWorld))
    program.set('params.ndcToView', this.ndcToView)
    program.set('params.viewport', this.viewport)
    program.set('params.depthRange', this.depthRange)
    // unset until the time of day system provides fog parameters, zero values result in no fog
    setIfPresent(program, 'params.volumetricFogParams', inputs.get(InputSlots.Global.VolumetricFogParams))
    setIfPresent(program, 'params.volumetricFogRampParams', inputs.get(InputSlots.Global.VolumetricFogRampParams))
    setIfPresent(
      program,
      'params.volumetricFogColorGradientBase',
      inputs.get(InputSlots.Global.VolumetricFogColorGradientBase),
    )
    // height gradient and radial lobe, so geometry fog matches the fog applied to the sky
    setIfPresent(
      program,
      'params.volumetricFogColorGradientParams',
      inputs.get(InputSlots.Global.VolumetricFogColorGradientParams),
    )
    setIfPresent(
      program,
      'params.volumetricFogColorGradientDelta',
      inputs.get(InputSlots.Global.VolumetricFogColorGradientDelta),
    )
    setIfPresent(
      program,
      'params.volumetricFogColorGradientRadial',
      inputs.get(InputSlots.Global.VolumetricFogColorGradientRadial),
    )
    setIfPresent(program, 'params.sunDirection', inputs.get(InputSlots.Global.SunDirection))
    // volumetric fog 2
    setIfPresent(program, 'params.volFog2HeightDensity', inputs.get(InputSlots.Global.VolFog2HeightDensity))
    setIfPresent(program, 'params.volFog2Ramp', inputs.get(InputSlots.Global.VolFog2Ramp))
    setIfPresent(program, 'params.volFog2Scattering', inputs.get(InputSlots.Global.VolFog2Scattering))
    setIfPresent(program, 'params.volFog2Blend', inputs.get(InputSlots.Global.VolFog2Blend))
    setIfPresent(program, 'params.volFog2Ambient', inputs.get(InputSlots.Global.VolFog2Ambient))
    setIfPresent(program, 'params.volFog2Zenith', inputs.get(InputSlots.Global.VolFog2Zenith))
    setIfPresent(program, 'params.fogScatteringColor', inputs.get(InputSlots.Global.FogScatteringColor))
    setIfPresent(
      program,
      'params.fogScatteringSecondaryColor',
      inputs.get(InputSlots.Global.FogScatteringSecondaryColor),
    )
    // set by the SkyLightSystem (config `volumetricFog`), on without one
    this.volFog2Enabled[0] = inputs.get(InputSlots.Global.VolFog2Enabled) ?? 1
    program.set('params.volFog2Enabled', this.volFog2Enabled)
    // froxel volume of this frame
    const volume = this.froxel?.integratedVolume ?? null
    this.froxelEnabled[0] = volume ? 1 : 0
    this.froxelEnabled[1] = this.froxel?.volumeSlices ?? 1
    this.froxelEnabled[2] = this.froxel?.volumeTileSize ?? 1
    program.set('params.froxelEnabled', this.froxelEnabled)
    program.set('params.froxelDepth', this.froxel?.depthParams ?? this.froxelEnabled)
    program.set('froxelVolume', volume ?? this.emptyVolume)
    program.set('froxelSampler', SamplerState.LinearClamp)
    // global probe in-scattering, see EnvProbeInputs. Without probes the stand-in volFog2Ambient applies
    const cubes = inputs.get(InputSlots.Global.ProbeSpecularCubes)
    const probe = inputs.get(InputSlots.Global.VolFog2Probe)
    if (cubes && probe) {
      setIfPresent(program, 'params.probeGlobal', inputs.get(InputSlots.Global.ProbeGlobal))
      program.set('params.volFog2Probe', probe)
      program.set('probeSpecularCubes', cubes)
      program.set('probeSampler', SamplerState.LinearClamp)
    } else {
      program.set('params.volFog2Probe', NO_PROBE)
    }
  }

  private volFog2Enabled = new Float32Array(4)
}

const NO_PROBE = new Float32Array(4)

function setIfPresent(program: Program, path: string, value: InputValueType | null) {
  if (value != null) {
    program.set(path, value)
  }
}
