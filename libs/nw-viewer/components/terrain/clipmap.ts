import { Color3, Constants, Mesh, Scene, Texture, Vector2, Vector3, VertexData } from '@babylonjs/core'
import { Rectangle } from '../../math'
import { ClipmapMaterial } from './clipmap-material'

export interface ClipmapOptions {
  index: number
  vertexPerSide: number
}

export class Clipmap {
  /**
   * The index of this clipmap
   */
  public readonly index: number
  /**
   * Vertex density. Simply 2^index
   */
  public readonly density: number
  /**
   * Gets the number of vertices per side of the clip. This is always one less than
   * power of two (2^x - 1).
   */
  public readonly clipsize: number

  /**
   * The center of the clipmap geometry
   */
  public readonly center: Vector2 = new Vector2(0, 0)
  /**
   * The origin of the clipmap geometry
   */
  public readonly origin: Vector2 = new Vector2(0, 0)
  /**
   * The movement delta since last update
   */
  public readonly delta: Vector2 = new Vector2(0, 0)

  public constructor(options: ClipmapOptions) {
    this.index = options.index
    this.density = Math.pow(2, options.index)
    this.clipsize = options.vertexPerSide
  }

  public updatePosition(cameraPosition: Vector3) {
    // snap camera position
    const d2 = this.density * 2 // next coarser level density
    const cx = Math.floor(Math.floor(cameraPosition.x) / d2) * d2
    const cy = Math.floor(Math.floor(cameraPosition.z) / d2) * d2

    this.delta.set(cx - this.center.x, cy - this.center.y)
    this.center.set(cx, cy)

    this.origin.x = cx + (1 - Math.floor(this.clipsize * 0.5)) * this.density
    this.origin.y = cy + (1 - Math.floor(this.clipsize * 0.5)) * this.density
  }
}

export type ClipMeshes = ReturnType<typeof createClipmapMeshes>
export function createClipmapMeshes(scene: Scene, vertexPerSide: number) {
  const n = vertexPerSide
  // check if n+1 is power of 2
  if (n < 3 || ((n + 1) & n) != 0) {
    throw new Error('vertexPerSide + 1 must be power of 2')
  }

  const m = (n + 1) / 4
  const block0 = createWxH(m, m, new Color3(0.25, 0.75, 0.5)) // even
  const block1 = createWxH(m, m, new Color3(1, 0.5, 0.5)) // odd
  const fixV = createWxH(3, m, new Color3(0.5, 0.75, 0.75))
  const fixH = createWxH(m, 3, new Color3(0.5, 0.75, 0.75))
  const trimV = createWxH(2, 2 * m + 1, new Color3(0.75, 0.75, 0.5))
  const trimH = createWxH(2 * m + 1, 2, new Color3(0.75, 0.75, 0.5))

  const center: Mesh[] = []
  const blocks: Mesh[] = []
  const fixups: Mesh[] = []
  const trims: Mesh[] = []
  const inner: Mesh[] = []
  const material = new ClipmapMaterial('clipmap', scene) // new PBRMaterial('terrain', scene)

  // material.fillMode = Constants.MATERIAL_TriangleStripDrawMode

  function meshWithOffset(name: string, x: number, z: number, vertex: VertexData) {
    const mesh = new Mesh(name, scene)
    vertex.applyToMesh(mesh, true)

    mesh.position.x = x
    mesh.position.z = z
    mesh.material = material
    // mesh.material.wireframe = true

    const info = mesh.getBoundingInfo()
    const min = info.minimum
    const max = info.maximum
    max.y = 2048
    mesh.buildBoundingInfo(min, max)
    return mesh
  }

  const p0 = 0
  const p1 = m - 1
  const p2 = p1 + m - 1
  const p3 = p2 + 2
  const p4 = p3 + m - 1

  center.push(meshWithOffset(`MxM center 1`, p1 + 1, p1 + 1, block0))
  center.push(meshWithOffset(`MxM center 2`, p2 + 1, p1 + 1, block1))
  center.push(meshWithOffset(`MxM center 3`, p1 + 1, p2 + 1, block1))
  center.push(meshWithOffset(`MxM center 4`, p2 + 1, p2 + 1, block0))

  blocks.push(meshWithOffset(`MxM outer 1`, p0, p0, block0))
  blocks.push(meshWithOffset(`MxM outer 2`, p1, p0, block1))
  blocks.push(meshWithOffset(`MxM outer 3`, p3, p0, block0))
  blocks.push(meshWithOffset(`MxM outer 4`, p4, p0, block1))

  blocks.push(meshWithOffset(`MxM outer 5`, p0, p1, block1))
  blocks.push(meshWithOffset(`MxM outer 6`, p4, p1, block0))
  blocks.push(meshWithOffset(`MxM outer 7`, p0, p3, block0))
  blocks.push(meshWithOffset(`MxM outer 8`, p4, p3, block1))

  blocks.push(meshWithOffset(`MxM outer 5`, p0, p4, block1))
  blocks.push(meshWithOffset(`MxM outer 6`, p1, p4, block0))
  blocks.push(meshWithOffset(`MxM outer 7`, p3, p4, block1))
  blocks.push(meshWithOffset(`MxM outer 8`, p4, p4, block0))

  fixups.push(meshWithOffset(`Mx3 fixup 1`, p2, p0, fixV))
  fixups.push(meshWithOffset(`Mx3 fixup 2`, p4, p2, fixH))
  fixups.push(meshWithOffset(`Mx3 fixup 3`, p2, p4, fixV))
  fixups.push(meshWithOffset(`Mx3 fixup 4`, p0, p2, fixH))

  trims.push(meshWithOffset(`trim 1`, p1, p1, trimH))
  trims.push(meshWithOffset(`trim 2`, p4 - 1, p1, trimV))
  trims.push(meshWithOffset(`trim 3`, p1, p4 - 1, trimH))
  trims.push(meshWithOffset(`trim 4`, p1, p1, trimV))

  return {
    material,
    center,
    blocks,
    fixups,
    trims,
  }
}

function createWxH(w: number, h: number, color: Color3) {
  const indices: number[] = []
  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  // vertices
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      positions.push(x, 0, y)
      normals.push(0, 1, 0)
      colors.push(color.r, color.g, color.b, 1)
    }
  }
  // indices (triangle strip)
  // for (let y = 0; y < h - 1; y++) {
  //   indices.push(y * w)
  //   for (let x = 0; x < w; x++) {
  //     indices.push(y * w + x)
  //     indices.push(y * w + x + w)
  //   }
  //   indices.push(y * w + 2 * w - 1)
  // }

  // indices (triangle list)
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x
      indices.push(i, i + w + 1, i + w)
      indices.push(i, i + 1, i + w + 1)
    }
  }
  const vertexData = new VertexData()

  vertexData.indices = indices
  vertexData.positions = positions
  vertexData.normals = normals
  vertexData.colors = colors

  return vertexData
}

export interface ClipmapCommand {
  id: string
  image: Texture
  source: Rectangle
  target: Rectangle
}
