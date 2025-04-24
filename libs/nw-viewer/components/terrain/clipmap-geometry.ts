import { Color3, Mesh, Scene, VertexData } from '@babylonjs/core'
import { ClipmapMaterial } from './clipmap-material'

export type ClipmapGeometry = ReturnType<typeof clipmapGeometry>
export function clipmapGeometry(scene: Scene, vertexPerSide: number) {
  const n = vertexPerSide
  // check if n+1 is power of 2
  if (n < 3 || ((n + 1) & n) != 0) {
    throw new Error('vertexPerSide + 1 must be power of 2')
  }

  const m = (n + 1) / 4
  const blockEvn = createWxH(m, m, new Color3(0.25, 0.75, 0.5), false)
  const blockOdd = createWxH(m, m, new Color3(1, 0.5, 0.5), true)
  const fixEV = createWxH(3, m, new Color3(0.5, 0.75, 0.75), false)
  const fixOV = createWxH(3, m, new Color3(0.5, 0.75, 0.75), true)
  const fixEH = createWxH(m, 3, new Color3(0.5, 0.75, 0.75), false)
  const fixOH = createWxH(m, 3, new Color3(0.5, 0.75, 0.75), true)
  const trimEV = createWxH(2, 2 * m + 1, new Color3(0.75, 0.75, 0.5), false)
  const trimOV = createWxH(2, 2 * m + 1, new Color3(0.75, 0.75, 0.5), true)
  const trimEH = createWxH(2 * m + 1, 2, new Color3(0.75, 0.75, 0.5), false)
  const trimOH = createWxH(2 * m + 1, 2, new Color3(0.75, 0.75, 0.5), true)

  const center: Mesh[] = []
  const blocks: Mesh[] = []
  const fixups: Mesh[] = []
  const trims: Mesh[] = []
  const material = new ClipmapMaterial('clipmap', scene)

  function meshWithOffset(name: string, x: number, z: number, vertex: VertexData) {
    const mesh = new Mesh(name, scene)
    vertex.applyToMesh(mesh, true)

    mesh.position.x = x
    mesh.position.z = z
    mesh.material = material
    mesh.alwaysSelectAsActiveMesh = true

    const info = mesh.getBoundingInfo()
    const min = info.minimum
    const max = info.maximum
    max.y = 2048
    mesh.buildBoundingInfo(min, max)
    return mesh
  }

  const off = Math.floor(n / 2) // offset to center the clipmap
  const p0 = -off + 0
  const p1 = -off + m - 1
  const p2 = p1 + m - 1
  const p3 = p2 + 2
  const p4 = p3 + m - 1

  center.push(meshWithOffset(`MxM center 1`, p1 + 1, p1 + 1, blockEvn))
  center.push(meshWithOffset(`MxM center 2`, p2 + 1, p1 + 1, blockOdd))
  center.push(meshWithOffset(`MxM center 3`, p1 + 1, p2 + 1, blockOdd))
  center.push(meshWithOffset(`MxM center 4`, p2 + 1, p2 + 1, blockEvn))

  blocks.push(meshWithOffset(`MxM outer 1`, p0, p0, blockEvn))
  blocks.push(meshWithOffset(`MxM outer 2`, p1, p0, blockOdd))
  blocks.push(meshWithOffset(`MxM outer 3`, p3, p0, blockEvn))
  blocks.push(meshWithOffset(`MxM outer 4`, p4, p0, blockOdd))

  blocks.push(meshWithOffset(`MxM outer 5`, p0, p1, blockOdd))
  blocks.push(meshWithOffset(`MxM outer 6`, p4, p1, blockEvn))
  blocks.push(meshWithOffset(`MxM outer 7`, p0, p3, blockEvn))
  blocks.push(meshWithOffset(`MxM outer 8`, p4, p3, blockOdd))

  blocks.push(meshWithOffset(`MxM outer 5`, p0, p4, blockOdd))
  blocks.push(meshWithOffset(`MxM outer 6`, p1, p4, blockEvn))
  blocks.push(meshWithOffset(`MxM outer 7`, p3, p4, blockOdd))
  blocks.push(meshWithOffset(`MxM outer 8`, p4, p4, blockEvn))

  fixups.push(meshWithOffset(`Mx3 fixup 1`, p2, p0, fixEV))
  fixups.push(meshWithOffset(`Mx3 fixup 2`, p4, p2, fixOH))
  fixups.push(meshWithOffset(`Mx3 fixup 3`, p2, p4, fixOV))
  fixups.push(meshWithOffset(`Mx3 fixup 4`, p0, p2, fixEH))

  trims.push(meshWithOffset(`trim 1`, p1, p1, trimEH))
  trims.push(meshWithOffset(`trim 2`, p4 - 1, p1, trimOV))
  trims.push(meshWithOffset(`trim 3`, p1, p4 - 1, trimOH))
  trims.push(meshWithOffset(`trim 4`, p1, p1, trimEV))

  return {
    material,
    center,
    blocks,
    fixups,
    trims,
  }
}

function createWxH(w: number, h: number, color: Color3, odd: boolean = false) {
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

  let i = 0
  for (let y = 0; y < h - 1; y++) {
    let colOdd = odd
    for (let x = 0; x < w - 1; x++) {
      i = y * w + x
      if (colOdd) {
        indices.push(i, i + 1, i + w + 1)
        indices.push(i, i + w + 1, i + w)
      } else {
        indices.push(i, i + 1, i + w)
        indices.push(i + w, i + 1, i + w + 1)
      }
      colOdd = !colOdd
    }
    odd = !odd
  }
  const vertexData = new VertexData()

  vertexData.indices = indices
  vertexData.positions = positions
  vertexData.normals = normals
  vertexData.colors = colors

  return vertexData
}
