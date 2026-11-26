import {
  boxGeometry,
  Buffer,
  bufferLayout,
  BufferRecorder,
  BufferUsage,
  buildSphere,
  cylinderGeometry,
  Device,
  discGeometry,
  Geometry,
  Mesh,
  planeGeometry,
  sphereGeometry,
} from '@gglib/graphics'
import { mat4CreateRotationX, type IVec3, type IVec4, type Mat4 } from '@gglib/math'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import type { DebugShapeType } from './DebugShapeComponent'

export const instanceLayout = bufferLayout([
  { name: 'transform', type: 'mat4x4f' },
  { name: 'color', type: 'vec4f' },
])

export class DebugMesh extends Mesh {
  private writer: BufferRecorder
  private buffer: Buffer

  public get material() {
    return this.materials[0] as ShapeMaterial
  }

  public constructor(device: Device, geometry: Geometry) {
    super(device, {
      geometries: [geometry],
      materials: [new ShapeMaterial(device, { properties: {} })],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    this.writer = new BufferRecorder({
      autosize: true,
      capacity: 1024,
      recordByteSize: instanceLayout.byteSize,
    })
    this.buffer = device.createBuffer({
      usage: BufferUsage.STORAGE,
      size: this.writer.capacity * this.writer.strideInBytes,
      readWrite: true,
    })
  }

  public getInstanceCount() {
    return this.writer.count
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

  public writeColor(value: IVec4 | IVec3) {
    this.writer.writeField(instanceLayout.fields.color, value)
  }

  public commitInstanceData() {
    this.writer.upload(this.buffer)
    this.material.effect.program.mustGet('instances').setBuffer(this.buffer)
    this.geometries[0].instanceCount = this.writer.count
  }
}

const BY_TYPE_BUILDER: Record<string, (device: Device, solid: boolean) => Geometry> = {}

export function getDebugMeshBuilder(type: DebugShapeType) {
  BY_TYPE_BUILDER[type] ||= (device, solid) => {
    return debugMeshGeometry(device, type, solid)
  }
  return BY_TYPE_BUILDER[type]
}

export function debugMeshGeometry(device: Device, type: DebugShapeType, solid: boolean) {
  switch (type) {
    case 'sphere':
    case 'bounds-sphere': {
      return sphereGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        radius: 1,
        stacks: 4,
        slices: 8,
        lines: !solid,
      })
    }
    case 'box':
    case 'bounds-box': {
      return boxGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        size: 1,
        lines: !solid,
      })
    }
    case 'plane': {
      return planeGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        size: 1,
        depthSegments: 2,
        widthSegments: 2,
        lines: !solid,
      })
    }
    case 'disc': {
      return discGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        radius: 1,
        lines: !solid,
      })
    }
    case 'cylinder': {
      return cylinderGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        height: 1,
        radius: 1,
        lines: !solid,
      })
    }
    case 'cone': {
      return cylinderGeometry(device, {
        vertexTransform: mat4CreateRotationX(Math.PI / 2), // rotate to z up
        height: 1,
        radius: 1,
        topRadius: 0,
        lines: !solid,
      })
    }
    default: {
      throw new Error(`Unsupported shape type: ${type}`)
    }
  }
}
