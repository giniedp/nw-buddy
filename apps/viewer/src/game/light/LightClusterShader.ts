import {
  bufferField,
  bufferLayout,
  bufferRecorder,
  BufferUsage,
  shaderConstants,
  type Buffer,
  type BufferRecorder,
  type ShaderModule,
  type WebGpuDevice,
} from '@gglib/graphics'
import { vec4, vec4$init, type IVec3, type Mat4 } from '@gglib/math'
import { LIGHT_CLUSTER_WGSL } from './LightClusterShader.wgsl'

// must match LIGHT_TYPE_* constants in material/common.wgsl.ts
const LIGHT_TYPE_POINT = 2
const LIGHT_TYPE_SPOT = 3
const LIGHT_TYPE_AREA = 4
// added to the light type of ambient only lights
const LIGHT_TYPE_AMBIENT = 8
// flag bits above the type, see LIGHT_FLAG_* in material/common.wgsl.ts
const LIGHT_FLAG_FOG = 16
const LIGHT_FLAG_FOG_ONLY = 32
const LIGHT_FLAG_PROBE = 64
const LIGHT_CLUSTER_WORKGROUP_SIZE = 64
// points share the cone code of the spots (getClusterLight), their direction must be finite
const NO_DIRECTION: IVec3 = { x: 0, y: 0, z: 0 }

export type LightClusterLightType = 'point' | 'spot' | 'area'

/**
 * Describes a single light to be added to the cluster light list
 */
export interface LightClusterLight {
  type: LightClusterLightType
  /** World space position */
  position: IVec3
  /** Normalized world space emission axis (spot and area lights) */
  direction: IVec3
  /** Normalized world space axis along which area lights span their width. Height spans along direction x tangent */
  tangent: IVec3
  /** Light range */
  range: number
  /** Diffuse color, premultiplied with the diffuse intensity */
  color: IVec3
  /** Specular multiplier */
  specular: number
  /** Attenuation bulb size */
  bulbSize: number
  /** Ambient only light, multiplies the ambient lighting instead of adding direct light */
  ambient?: boolean
  /** Contributes to the froxel volumetric fog (DLF_VOLUMETRIC_FOG) */
  fog?: boolean
  /** Contributes to the froxel volumetric fog only, surfaces skip it */
  fogOnly?: boolean
  /** Area light width */
  width?: number
  /** Area light height */
  height?: number
  /** Outer cone half angle in radians. Defaults to 45 degrees for spot lights, optional for area lights */
  coneAngle?: number
  /** Inner cone half angle in radians. Defaults to 80% of {@link coneAngle} */
  coneAngleInner?: number
}

/**
 * An environment probe in the cluster light list, see {@link LightClusterShader.addProbe}
 */
export interface LightClusterProbe {
  /** World space center of the influence box */
  position: IVec3
  /** Normalized world space axes of the box (the probe's local x, y, z) */
  axisX: IVec3
  axisY: IVec3
  axisZ: IVec3
  /** Half size of the box along its axes */
  extents: IVec3
  /** Edge falloff of the attenuation (AttenuationFalloffMax) */
  falloff: number
  /** Slot of the cubes in the probe atlas */
  slot: number
  /** Diffuse light color */
  color: IVec3
  /** Specular factor, the specular color is color × specular */
  specular: number
}

export interface LightClusterShaderOptions {
  /** Initial capacity of the light list. The list grows when more lights are added */
  lightCapacity?: number
  /** Cluster grid size in x, y (screen tiles) and z (depth slices) */
  gridX?: number
  gridY?: number
  gridZ?: number
  /**
   * Depth range covered by the cluster grid. Fragments beyond {@link clusterFar} receive no local lights.
   * The LightSystem follows the camera far plane when no clusterFar is given.
   */
  clusterNear?: number
  clusterFar?: number
  /** Capacity of the light index list shared by all clusters */
  maxIndices?: number
}

/**
 * Computes a clustered Forward+ light list
 *
 * @remarks
 * Usage per frame:
 * - call {@link begin} to reset the light list
 * - call {@link addLight} for each light
 * - call {@link dispatch} with the view and projection matrix
 *
 * The compute pass assigns lights to a view space 3d cluster grid (no depth pre pass).
 * The result is available through {@link lightBuffer}, {@link clusterBuffer}, {@link indexBuffer}
 * and the {@link clusterGrid} and {@link clusterDepth} parameters.
 */
export class LightClusterShader {
  public readonly gridX: number
  public readonly gridY: number
  public readonly gridZ: number
  public readonly maxIndices: number
  public clusterNear: number
  public clusterFar: number

  /** Number of lights added since last {@link begin} */
  public lightCount = 0

  /** Light records, one per light */
  public readonly lightBuffer: Buffer
  /** Per cluster offset and count into the {@link indexBuffer} */
  public readonly clusterBuffer: Buffer
  /** Light indices referenced by the clusters */
  public readonly indexBuffer: Buffer
  /** Cluster grid size (xyz) and light count (w) */
  public readonly clusterGrid = vec4(0)
  /** Cluster near, far, and depth slice scale and bias */
  public readonly clusterDepth = vec4(0)

  public get clusterCount() {
    return this.gridX * this.gridY * this.gridZ
  }

  public get isValid() {
    return !!this.shader?.isValid
  }

  private device: WebGpuDevice
  private zeroData = new Uint32Array(1)
  private lightData: BufferRecorder
  private lightLayout = bufferLayout([
    bufferField('position', 'vec4f'),
    bufferField('color', 'vec4f'),
    bufferField('direction', 'vec4f'),
    bufferField('tangent', 'vec4f'),
    bufferField('params', 'vec4f'),
    bufferField('bounds', 'vec4f'),
  ])
  private counterBuffer: Buffer
  private shader: ShaderModule

  private paramsProjection = vec4()
  private paramsGrid = vec4()
  private paramsDepth = vec4()

  public constructor(device: WebGpuDevice, options?: LightClusterShaderOptions) {
    this.device = device
    this.gridX = options?.gridX ?? 16
    this.gridY = options?.gridY ?? 9
    this.gridZ = options?.gridZ ?? 32
    this.clusterNear = options?.clusterNear ?? 0.5
    this.clusterFar = options?.clusterFar ?? 1024
    this.maxIndices = options?.maxIndices ?? this.gridX * this.gridY * this.gridZ * 32
    this.lightData = bufferRecorder({
      capacity: options?.lightCapacity ?? 4096,
      recordByteSize: this.lightLayout.byteSize,
      autosize: true,
    })

    this.lightBuffer = device.createBuffer({
      name: 'Lights: light list',
      usage: BufferUsage.STORAGE,
      size: this.lightData.buffer.byteLength,
    })
    this.lightData.gpuBuffer = this.lightBuffer
    this.clusterBuffer = device.createBuffer({
      name: 'Lights: clusters',
      usage: BufferUsage.STORAGE,
      size: this.clusterCount * this.lightLayout.byteSize,
      readWrite: true,
    })
    this.indexBuffer = device.createBuffer({
      name: 'Lights: indices',
      usage: BufferUsage.STORAGE,
      size: this.maxIndices * 4,
      readWrite: true,
    })
    this.counterBuffer = device.createBuffer({
      name: 'Lights: index counter',
      usage: BufferUsage.STORAGE,
      size: this.zeroData.byteLength,
    })
    this.shader = device.createShaderModule({
      name: 'Lights: cluster assignment',
      wgsl: {
        source: LIGHT_CLUSTER_WGSL,
        computeConstants: shaderConstants({ WORKGROUP_SIZE: LIGHT_CLUSTER_WORKGROUP_SIZE }),
      },
    })
    this.updateClusterParams()
  }

  /**
   * Resets the light list
   */
  public begin(): this {
    this.lightData.reset()
    this.lightCount = 0
    return this
  }

  /**
   * Adds a light to the light list
   *
   * @returns false if the light has no effect and was skipped
   */
  public addLight(light: LightClusterLight): boolean {
    const pos = light.position
    const dir = light.type === 'point' ? NO_DIRECTION : light.direction
    const tan = light.tangent
    const color = light.color
    const range = Math.max(light.range || 0, 0.001)
    if (!(color.x > 0 || color.y > 0 || color.z > 0) && !(light.specular > 0)) {
      return false
    }

    let type = 0
    let halfW = 0
    let halfH = 0
    let cosOuter = -2
    let cosInner = -1
    let boundsX = pos.x
    let boundsY = pos.y
    let boundsZ = pos.z
    let boundsR = range

    switch (light.type) {
      case 'point': {
        type = LIGHT_TYPE_POINT
        break
      }
      case 'spot': {
        type = LIGHT_TYPE_SPOT
        const halfAngle = light.coneAngle ?? Math.PI * 0.25
        cosOuter = Math.cos(halfAngle)
        cosInner = Math.cos(light.coneAngleInner ?? halfAngle * 0.8)
        // tighter bounding sphere around the cone if possible
        const coneRadius = Math.sqrt((range * 0.5) ** 2 + (range * Math.tan(halfAngle)) ** 2)
        if (coneRadius < range) {
          boundsX = pos.x + dir.x * range * 0.5
          boundsY = pos.y + dir.y * range * 0.5
          boundsZ = pos.z + dir.z * range * 0.5
          boundsR = coneRadius
        }
        break
      }
      case 'area': {
        type = LIGHT_TYPE_AREA
        halfW = Math.max((light.width || 0) * 0.5, 0.001)
        halfH = Math.max((light.height || 0) * 0.5, 0.001)
        // spot falloff of the emission (GetSpotAttenuation), no falloff at 90 degrees and above (cos <= 0)
        const halfAngle = light.coneAngle || 0
        if (halfAngle > 0) {
          cosOuter = Math.cos(halfAngle)
        }
        boundsR = range + Math.sqrt(halfW * halfW + halfH * halfH)
        break
      }
      default: {
        return false
      }
    }
    if (light.ambient) {
      type += LIGHT_TYPE_AMBIENT
    }
    if (light.fog || light.fogOnly) {
      type += LIGHT_FLAG_FOG
    }
    if (light.fogOnly) {
      type += LIGHT_FLAG_FOG_ONLY
    }

    this.lightData
      .seek(this.lightCount)
      // position: xyz, range
      .writeFloat32x4(pos.x, pos.y, pos.z, range)
      // color: rgb diffuse, specular multiplier
      .writeFloat32x4(color.x, color.y, color.z, light.specular)
      // direction: xyz, type
      .writeFloat32x4(dir.x, dir.y, dir.z, type)
      // tangent: area width axis, attenuation bulb size
      .writeFloat32x4(tan.x, tan.y, tan.z, light.bulbSize)
      // params
      .writeFloat32x4(halfW, halfH, cosOuter, cosInner)
      // bounds
      .writeFloat32x4(boundsX, boundsY, boundsZ, boundsR)
    this.lightCount++
    return true
  }

  /**
   * Adds an environment probe to the light list. Probes go first, in blend order: the clusters keep the list order
   * and the shading takes the probes from the start of a cluster (TiledShading.cfi "Environment probes").
   */
  public addProbe(probe: LightClusterProbe): void {
    const { position: pos, axisX, axisY, axisZ, extents: ext, color } = probe
    const radius = Math.hypot(ext.x, ext.y, ext.z)
    this.lightData
      .seek(this.lightCount)
      // position: center, atlas slot
      .writeFloat32x4(pos.x, pos.y, pos.z, probe.slot)
      // color: rgb diffuse, specular factor
      .writeFloat32x4(color.x, color.y, color.z, probe.specular)
      // direction, tangent, params: the box axes scaled by 1 / extents, so the box spans -1..1
      .writeFloat32x4(axisX.x / ext.x, axisX.y / ext.x, axisX.z / ext.x, LIGHT_FLAG_PROBE)
      .writeFloat32x4(axisY.x / ext.y, axisY.y / ext.y, axisY.z / ext.y, Math.max(probe.falloff, 0.001))
      .writeFloat32x4(axisZ.x / ext.z, axisZ.y / ext.z, axisZ.z / ext.z, 0)
      // bounds: the sphere around the box
      .writeFloat32x4(pos.x, pos.y, pos.z, radius)
    this.lightCount++
  }

  /**
   * Uploads the light list and dispatches the cluster assignment compute pass
   *
   * @param view - the view matrix
   * @param projection - the projection matrix
   */
  public dispatch(view: Mat4, projection: Mat4): void {
    if (!this.isValid) {
      return
    }
    const count = this.lightCount
    // grows the gpu buffer when the light list has grown
    this.lightData.commit()
    this.counterBuffer.setSubData(0, this.zeroData)

    vec4$init(this.paramsProjection, projection[0], projection[5], projection[8], projection[9])
    vec4$init(this.paramsGrid, this.gridX, this.gridY, this.gridZ, count)
    vec4$init(this.paramsDepth, this.clusterNear, this.clusterFar, this.maxIndices, 0)

    const program = this.shader.program
    program.mustSet('params.viewMatrix', view)
    program.mustSet('params.projection', this.paramsProjection)
    program.mustSet('params.grid', this.paramsGrid)
    program.mustSet('params.depth', this.paramsDepth)
    program.mustSet('lights', this.lightBuffer)
    program.mustSet('clusters', this.clusterBuffer)
    program.mustSet('indices', this.indexBuffer)
    program.mustSet('counter', this.counterBuffer)
    program.commit()

    const pass = this.device.computePass
    pass.setProgram(program)
    pass.dispatch(Math.ceil(this.clusterCount / LIGHT_CLUSTER_WORKGROUP_SIZE))
    pass.flush()

    this.updateClusterParams()
  }

  private updateClusterParams() {
    const near = this.clusterNear
    const far = this.clusterFar
    const logRatio = Math.log(far / near)
    this.clusterGrid.x = this.gridX
    this.clusterGrid.y = this.gridY
    this.clusterGrid.z = this.gridZ
    this.clusterGrid.w = this.lightCount
    this.clusterDepth.x = near
    this.clusterDepth.y = far
    this.clusterDepth.z = this.gridZ / logRatio
    this.clusterDepth.w = (-this.gridZ * Math.log(near)) / logRatio
  }

  public dispose(): void {
    this.lightBuffer?.dispose()
    this.clusterBuffer?.dispose()
    this.indexBuffer?.dispose()
    this.counterBuffer?.dispose()
    this.shader?.dispose()
  }
}
