import { GeometryBuilder, type Device, type Geometry } from '@gglib/graphics'
import { mat4$premultiply, mat4CreateFromRTS, mat4CreateRotationX, vec3, vec4, type Mat4 } from '@gglib/math'
// the shader ball of the gglib docs (glib/assets/models/gltf), copied into the project
import shaderBallUrl from '../../assets/shader-ball.glb?url'

/**
 * The parts of the shader ball: the stand (`Foot Ring`), the shell that shows the material (`Sphere Outer`) and the
 * core inside it (`Sphere Inside`)
 */
export interface ShaderBallGeometries {
  base: Geometry
  shell: Geometry
  core: Geometry
}

/**
 * Size of the shader ball after the conversion to the viewer's space (Z up), in meters
 */
export const SHADER_BALL_SIZE = { width: 2.7, height: 2.2 }

/**
 * One part of the glb as plain arrays, in the viewer's space (Z up)
 */
interface ShaderBallPart {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint16Array | Uint32Array
  transform: Mat4
}

const PART_NODES = { base: 'Foot Ring', shell: 'Sphere Outer', core: 'Sphere Inside' } as const

/**
 * Opaque white as the vertex color: the color channel is `unorm8x4`, packed into one uint32 on the CPU
 */
const WHITE = 0xffffffff

let parts: Promise<Record<keyof ShaderBallGeometries, ShaderBallPart>> | null = null

/**
 * Builds the shader ball geometries: position, normal, tangent, bitangent, texture and color like the other preview
 * geometries, tangents calculated from the uvs (the glb has none, the materials need them). The glb is read once,
 * the geometries are new on every call: the meshes that hold them dispose them with the preview.
 */
export async function loadShaderBallGeometries(device: Device): Promise<ShaderBallGeometries> {
  parts ??= loadParts().catch((err) => {
    parts = null
    throw err
  })
  const loaded = await parts
  return {
    base: buildPart(device, loaded.base, 'Shader Ball Base'),
    shell: buildPart(device, loaded.shell, 'Shader Ball Shell'),
    core: buildPart(device, loaded.core, 'Shader Ball Core'),
  }
}

function buildPart(device: Device, part: ShaderBallPart, name: string): Geometry {
  const builder = new GeometryBuilder({
    layout: [['position', 'normal', 'tangent', 'bitangent', 'texture', 'color']],
  })
  builder.pushTransform(part.transform)
  const count = part.positions.length / 3
  for (let i = 0; i < count; i++) {
    builder.addVertex({
      position: [part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]],
      normal: [part.normals[i * 3], part.normals[i * 3 + 1], part.normals[i * 3 + 2]],
      texture: [part.uvs[i * 2], part.uvs[i * 2 + 1]],
      // white and opaque: Illum with %VERTCOLORS multiplies the diffuse color and the alpha by it
      color: WHITE,
    })
  }
  for (let i = 0; i < part.indices.length; i++) {
    builder.addIndex(part.indices[i])
  }
  builder.calculateTangents()
  builder.calculateBounds()
  return builder.buildGeometry(device, { name })
}

interface GltfJson {
  nodes: Array<{
    name: string
    mesh?: number
    translation?: number[]
    rotation?: number[]
    scale?: number[]
  }>
  meshes: Array<{ primitives: Array<{ attributes: Record<string, number>; indices: number }> }>
  accessors: Array<{ bufferView: number; byteOffset?: number; componentType: number; count: number; type: string }>
  bufferViews: Array<{ byteOffset?: number; byteLength: number }>
}

const COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }

/**
 * Reads the glb: the json chunk and the binary chunk, the three parts by node name. The node transforms are combined
 * with the turn from glTF's Y up into the viewer's Z up (a rotation, the winding stays).
 */
async function loadParts(): Promise<Record<keyof ShaderBallGeometries, ShaderBallPart>> {
  const res = await fetch(shaderBallUrl)
  if (!res.ok) {
    throw new Error(`shader ball: ${res.status} ${res.statusText}`)
  }
  const data = await res.arrayBuffer()
  const view = new DataView(data)
  if (view.getUint32(0, true) !== 0x46546c67) {
    throw new Error('shader ball: not a glb file')
  }
  const jsonLength = view.getUint32(12, true)
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength))) as GltfJson
  const binStart = 20 + jsonLength + 8

  const accessor = (index: number) => {
    const it = json.accessors[index]
    const bufferView = json.bufferViews[it.bufferView]
    const offset = binStart + (bufferView.byteOffset ?? 0) + (it.byteOffset ?? 0)
    const length = it.count * COMPONENTS[it.type]
    switch (it.componentType) {
      case 5126:
        return new Float32Array(data.slice(offset, offset + length * 4))
      case 5123:
        return new Uint16Array(data.slice(offset, offset + length * 2))
      case 5125:
        return new Uint32Array(data.slice(offset, offset + length * 4))
    }
    throw new Error(`shader ball: unsupported component type ${it.componentType}`)
  }

  const zUp = mat4CreateRotationX(Math.PI / 2)
  const part = (nodeName: string): ShaderBallPart => {
    const node = json.nodes.find((it) => it.name === nodeName)
    if (node?.mesh == null) {
      throw new Error(`shader ball: node '${nodeName}' not found`)
    }
    const primitive = json.meshes[node.mesh].primitives[0]
    const r = node.rotation ?? [0, 0, 0, 1]
    const t = node.translation ?? [0, 0, 0]
    const s = node.scale ?? [1, 1, 1]
    const transform = mat4CreateFromRTS(vec4(r[0], r[1], r[2], r[3]), vec3(t[0], t[1], t[2]), vec3(s[0], s[1], s[2]))
    mat4$premultiply(transform, zUp)
    return {
      positions: accessor(primitive.attributes.POSITION) as Float32Array,
      normals: accessor(primitive.attributes.NORMAL) as Float32Array,
      uvs: accessor(primitive.attributes.TEXCOORD_0) as Float32Array,
      indices: accessor(primitive.indices) as Uint16Array | Uint32Array,
      transform,
    }
  }
  return { base: part(PART_NODES.base), shell: part(PART_NODES.shell), core: part(PART_NODES.core) }
}
