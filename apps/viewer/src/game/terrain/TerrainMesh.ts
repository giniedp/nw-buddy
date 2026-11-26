import {
  Buffer,
  bufferField,
  bufferLayout,
  BufferRecorder,
  BufferUsage,
  Device,
  Mesh,
  patchGeometry,
  type Effect,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, type Mat4, mat4CreateAxisAngle, vec3, type IVec4 } from '@gglib/math'
import { TerrainPatchMaterial, WaterPatchMaterial } from '../../material'

export interface TerrainMeshOptions {
  size: number
}

const instanceLayout = bufferLayout([
  bufferField('transform', 'mat4x4f'),
  bufferField('params1', 'vec4f'),
  bufferField('params2', 'vec4f'),
  bufferField('params3', 'vec4f'),
  bufferField('regionParams', 'vec4f'),
  bufferField('macroColor', 'vec4f'),
  bufferField('heightUvTransform', 'vec4f'),
  bufferField('heightUvTransformCoarse', 'vec4f'),
])

export class TerrainMesh extends Mesh {
  public readonly writer: BufferRecorder
  public readonly buffer: Buffer

  public get TerrainMaterial() {
    return this.materials[0] as TerrainPatchMaterial
  }

  public get WaterMaterial() {
    return this.materials[1] as WaterPatchMaterial
  }
  public set WaterMaterial(value: WaterPatchMaterial) {
    this.materials[1] = value
  }

  public constructor(device: Device, options: TerrainMeshOptions) {
    super(device, {
      geometries: [createQuadGeometry(device, { size: options.size })],
      materials: [
        new TerrainPatchMaterial(device, { properties: {} }),
        new WaterPatchMaterial(device, { properties: {} }),
      ],
      parts: [
        { geometryIndex: 0, materialIndex: 0 },
        { geometryIndex: 0, materialIndex: 1 },
      ],
    })
    this.writer = new BufferRecorder({
      autosize: true,
      capacity: 1024,
      recordByteSize: instanceLayout.byteSize,
    })
    this.buffer = device.createBuffer({
      usage: BufferUsage.STORAGE,
      size: this.writer.capacity * instanceLayout.byteSize,
      readWrite: true,
    })
  }

  public resetInstanceCount() {
    this.writer.setCount(0)
  }

  public startInstance(index: number) {
    this.writer.seek(index)
  }

  public writeTransform(value: Mat4) {
    this.writer.writeField(instanceLayout.fields.transform, value)
  }

  public writeParams1(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params1, value)
  }

  public writeParams2(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params2, value)
  }

  public writeParams3(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params3, value)
  }

  public writeRegionParams(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.regionParams, value)
  }

  public writeMacroColor(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.macroColor, value)
  }

  public writeHeightUvTransform(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.heightUvTransform, value)
  }

  public writeHeightUvTransformCoarse(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.heightUvTransformCoarse, value)
  }

  private bindEffect = (effect: Effect) => effect.program.mustGet('instances').setBuffer(this.buffer)

  public commitInstanceData() {
    this.writer.upload(this.buffer)
    // every render variant (forward, gbuffer, shadow) reads the same instance buffer
    this.TerrainMaterial.forEachEffect(this.bindEffect)
    this.WaterMaterial.forEachEffect(this.bindEffect)
    for (const geometry of this.geometries) {
      geometry.instanceCount = this.writer.count
    }
  }
}

interface QuadGeomOptions {
  size: number
  offset?: number
  lines?: boolean
}

function createQuadGeometry(device: Device, { size, offset = 0, lines = false }: QuadGeomOptions) {
  return patchGeometry(device, {
    vertexTransform: mat4CreateAxisAngle(vec3.UnitX, -90 * DEGREE_TO_RAD),
    width: size,
    depth: size,
    widthSegments: size,
    depthSegments: size,
    offset: {
      x: size / 2,
      y: offset || 0,
      z: size / 2,
    },
    lines,
  })
}
