import {
  inputSlot,
  ResourceOwnership,
  SamplerState,
  typedProgramInputs,
  type Device,
  type Ownable,
  type Program,
  type Texture,
  type WebGpuDevice,
} from '@gglib/graphics'
import { mat4Copy, mat4Identity, mat4Invert, mat4Multiply, vec4, type IVec3, type Mat4 } from '@gglib/math'
import { SSR_RESOLVE_WGSL, SSR_TRACE_WGSL, SSR_WORKGROUP_SIZE } from './Ssr.wgsl'

/**
 * The Hi-Z screen space reflection trace ({@link SSR_TRACE_WGSL}) and its cone traced resolve
 * ({@link SSR_RESOLVE_WGSL}) as an effect: set the inputs and fields, then {@link render} into a compute encoder.
 * Allocation free per frame, matrices are updated in place.
 */
export class SsrTraceEffect implements Ownable {
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  /**
   * The trace program, created on first access: the effect may be constructed before the device is ready
   */
  public get traceProgram(): Program {
    this.lazyTrace ||= this.createProgram('SSR Trace', SSR_TRACE_WGSL)
    return this.lazyTrace
  }

  /**
   * The resolve program, created on first access
   */
  public get resolveProgram(): Program {
    this.lazyResolve ||= this.createProgram('SSR Resolve', SSR_RESOLVE_WGSL)
    return this.lazyResolve
  }

  public readonly params = typedProgramInputs({
    viewProj: inputSlot('ssr', 'viewProj', 'mat4x4'),
    invViewProj: inputSlot('ssr', 'invViewProj', 'mat4x4'),
    prevViewProj: inputSlot('ssr', 'prevViewProj', 'mat4x4'),
    camera: inputSlot('ssr', 'camera', 'vec4'),
    forward: inputSlot('ssr', 'forward', 'vec4'),
    trace: inputSlot('ssr', 'trace', 'vec4'),
    extra: inputSlot('ssr', 'extra', 'vec4'),
    gbufferA: inputSlot('', 'gbufferA', 'texture'),
    gbufferC: inputSlot('', 'gbufferC', 'texture'),
    hiZ: inputSlot('', 'hiZ', 'texture'),
    linearDepth: inputSlot('', 'linearDepth', 'texture'),
    previousColor: inputSlot('', 'previousColor', 'texture'),
    linearSampler: inputSlot('', 'linearSampler', 'sampler'),
    outHits: inputSlot('', 'outHits', 'texture'),
    hits: inputSlot('', 'hits', 'texture'),
    outReflection: inputSlot('', 'outReflection', 'texture'),
    luminance: inputSlot('', 'luminance', 'texture'),
  })

  public get isCompiled() {
    return this.traceProgram.isCompiled && this.resolveProgram.isCompiled
  }

  /**
   * Max ray length in meters (the game: 1.5 × the pixel depth)
   */
  public maxDistance = 200
  /**
   * Thickness of the depth buffer surfaces relative to their depth, at least {@link minThickness} meters
   */
  public thickness = 0.03
  public minThickness = 0.15
  /**
   * Max Hi-Z traversal steps per ray
   */
  public maxIterations = 64
  /**
   * Rougher pixels are not traced (the probe reflection stays)
   */
  public minSmoothness = 0.3
  /**
   * Fade out width at the screen border, in texture coordinates (the game: 0.07)
   */
  public borderFade = 0.07
  /**
   * Max hit luminance relative to the average scene luminance (the game: 100), 0 turns the clamp off
   */
  public maxLuminance = 100

  private viewProj = mat4Identity()
  private invViewProj = mat4Identity()
  private prevViewProj = mat4Identity()
  private camera = vec4(0)
  private forward = vec4(0)
  private trace = vec4(0)
  private extra = vec4(0)

  private device: Device
  private lazyTrace: Program | null = null
  private lazyResolve: Program | null = null

  public constructor(device: Device) {
    this.device = device
    const params = this.params
    params.viewProj = this.viewProj
    params.invViewProj = this.invViewProj
    params.prevViewProj = this.prevViewProj
    params.camera = this.camera
    params.forward = this.forward
    params.trace = this.trace
    params.extra = this.extra
    params.linearSampler = SamplerState.LinearClamp
  }

  /**
   * Sets the camera of the current and the previous frame
   *
   * @param prevViewProj - view projection of the previous frame, the current one when null
   */
  public setCamera(
    projection: Mat4,
    view: Mat4,
    prevViewProj: Mat4 | null,
    position: IVec3,
    forward: IVec3,
    near: number,
    far: number,
  ) {
    mat4Multiply(projection, view, this.viewProj)
    mat4Invert(this.viewProj, this.invViewProj)
    mat4Copy(prevViewProj ?? this.viewProj, this.prevViewProj)
    this.camera.x = position.x
    this.camera.y = position.y
    this.camera.z = position.z
    this.camera.w = near
    this.forward.x = forward.x
    this.forward.y = forward.y
    this.forward.z = forward.z
    this.forward.w = far
  }

  /**
   * Traces every pixel of the output into `hits`, then resolves the hits into `output`
   *
   * @param luminance - 1x1 average scene luminance (x) for the hit clamp, null without a clamp
   * @param hits - rgba32float storage texture of the output size (previous frame uv of the hit, confidence)
   */
  public render(
    pass: WebGpuDevice['computePass'],
    linearDepth: Texture,
    hiZ: Texture,
    previousColor: Texture,
    luminance: Texture | null,
    hits: Texture,
    output: Texture,
  ) {
    const params = this.params
    this.trace.x = this.maxDistance
    this.trace.y = this.thickness
    this.trace.z = this.maxIterations
    this.trace.w = this.minSmoothness
    this.extra.x = hiZ.mipLevelCount
    this.extra.y = luminance ? this.maxLuminance : 0
    this.extra.z = this.borderFade
    this.extra.w = this.minThickness
    // the vector and matrix inputs are the objects above, set again so the blocks see a new version
    params.viewProj = this.viewProj
    params.invViewProj = this.invViewProj
    params.prevViewProj = this.prevViewProj
    params.camera = this.camera
    params.forward = this.forward
    params.trace = this.trace
    params.extra = this.extra
    params.hiZ = hiZ
    params.linearDepth = linearDepth
    params.previousColor = previousColor
    // without a luminance any float texture is bound, the shader does not read it
    params.luminance = luminance ?? previousColor
    params.outHits = hits
    params.hits = hits
    params.outReflection = output
    const groupsX = Math.ceil(output.width / SSR_WORKGROUP_SIZE)
    const groupsY = Math.ceil(output.height / SSR_WORKGROUP_SIZE)

    const trace = this.traceProgram
    trace.applyBlocks(params.blocks)
    trace.commit()
    pass.setProgram(trace)
    pass.dispatch(groupsX, groupsY)

    const resolve = this.resolveProgram
    resolve.applyBlocks(params.blocks)
    resolve.commit()
    pass.setProgram(resolve)
    pass.dispatch(groupsX, groupsY)
  }

  private createProgram(name: string, source: string): Program {
    const shader = this.ownership.adopt(this.device.createShaderModule({ name, wgsl: { source } }))
    return this.ownership.adopt(shader.program.clone())
  }

  public dispose() {
    this.ownership.finalize()
  }
}
