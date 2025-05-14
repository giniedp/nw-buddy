import {
  BufferAttribute,
  BufferGeometry,
  Color,
  LinearFilter,
  Material,
  Mesh,
  Object3D,
  RGBAFormat,
  Texture,
  TextureLoader,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { IntersectionType } from '../../math'
import { ClipmapShaderMaterial } from './clipmap-shader-material'
import { ClipmapUpdateMaterial } from './clipmap-update-material'
import { ScreenQuad } from './quad'

export interface ClipmapOptions {
  index: number
  vertexPerSide: number
  tileSize: number
  levelName: string
  coarse: Clipmap
  mountainHeight: number
}

export interface ClipmapTile {
  x: number
  y: number
  z: number
  intersection: IntersectionType
  texture?: Texture
  texture2?: Texture

  tx: number
  ty: number
  ts: number

  bounds: number[]
  ready: boolean
}

export class Clipmap extends Object3D {
  private meshes: ReturnType<typeof createClipmapMeshes>

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

  public heightmap: WebGLRenderTarget
  private heightmapMaterial: ClipmapUpdateMaterial
  private heightmapQuad: ScreenQuad

  public groundmap: WebGLRenderTarget
  private material: ClipmapShaderMaterial
  private texture: Texture

  private levelName: string
  private tileSize: number
  private bounds: number[] = [0, 0, 0, 0]
  private tiles: ClipmapTile[] = []
  private needsUpdate = true
  private loader: TextureLoader
  private coarse: Clipmap
  private mountainHeight: number
  public constructor(options: ClipmapOptions) {
    super()
    this.index = options.index
    this.density = Math.pow(2, options.index)
    this.clipsize = options.vertexPerSide
    this.tileSize = options.tileSize
    this.levelName = options.levelName
    this.loader = new TextureLoader()
    this.coarse = options.coarse
    this.mountainHeight = options.mountainHeight || 2048

    this.material = new ClipmapShaderMaterial()
    this.material.wireframe = false
    this.material.vertexColors = false
    this.material.fog = true
    this.material.color = new Color(0.376, 0.275, 0.059)

    this.meshes = createClipmapMeshes(options.vertexPerSide, this.material)
    this.add(...this.meshes.blocks)
    this.add(...this.meshes.center)
    this.add(...this.meshes.fixups)
    this.add(...this.meshes.trims)

    this.heightmapMaterial = new ClipmapUpdateMaterial()
    this.heightmapQuad = new ScreenQuad(this.heightmapMaterial)
    this.heightmap = new WebGLRenderTarget(this.clipsize + 1, this.clipsize + 1, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
    })
    this.groundmap = new WebGLRenderTarget(1024, 1024, {
      depthBuffer: false,
    })
  }

  public dispose() {
    this.remove(...this.meshes.blocks)
    this.remove(...this.meshes.center)
    this.remove(...this.meshes.fixups)
    this.remove(...this.meshes.trims)
    this.heightmap.dispose()
    this.groundmap.dispose()
    this.material.dispose()
  }

  public update(center: Vector3, renderer: WebGLRenderer) {
    this.updatePosition(center)
    this.updateVisibility(center)
    if (this.needsUpdate) {
      this.needsUpdate = false
      this.detectNewTiles()
      this.removeStaleTiles()
      this.updateHeightmap(renderer)
    }

    this.material.clipSize = this.clipsize
    this.material.clipDensity = this.density
    this.material.clipCenter = this.center
    this.material.clipOrigin = this.origin
    this.material.coarseOrigin = this.coarse?.origin || this.origin
    this.material.coarseCenter = this.coarse?.center || this.center
    this.material.coarseBlend = this.coarse ? 1.0 : 0.0
    this.material.clipHeight = this.mountainHeight
    this.material.clipTex1 = this.heightmap.texture
    this.material.clipTex2 = this.coarse?.heightmap.texture || null
  }

  private updatePosition(center: Vector3) {
    // snap camera position
    const d2 = this.density * 2 // next coarser level density
    const snapX = Math.floor(Math.floor(center.x) / d2) * d2
    const snapY = Math.floor(Math.floor(center.z) / d2) * d2

    const cx = snapX + this.density
    const cy = snapY + this.density
    this.delta.set(cx - this.center.x, cy - this.center.y)
    this.center.set(cx, cy)

    this.origin.x = cx + Math.floor(this.clipsize * 0.5) * this.density
    this.origin.y = cy - Math.floor(this.clipsize * 0.5) * this.density

    this.position.set(cx, -1, cy)
    this.scale.set(this.density, 1, this.density)
    this.updateMatrix()
    this.needsUpdate = this.needsUpdate || this.delta.lengthSq() > 0
  }

  private updateVisibility(center: Vector3) {
    for (const mesh of this.meshes.center) {
      mesh.visible = this.index === 0
    }
    if (this.index === 0) {
      this.meshes.trims[0].visible = true
      this.meshes.trims[1].visible = true
      this.meshes.trims[2].visible = true
      this.meshes.trims[3].visible = true
    } else {
      const xIsEven = Math.floor(center.x / this.density) % 2 === 0
      const zIsEven = Math.floor(center.z / this.density) % 2 === 0
      this.meshes.trims[0].visible = !zIsEven
      this.meshes.trims[1].visible = xIsEven
      this.meshes.trims[2].visible = zIsEven
      this.meshes.trims[3].visible = !xIsEven
    }
  }

  private detectNewTiles() {
    const tileSize = this.tileSize * this.density
    const clipSize = this.heightmap.width * this.density
    this.bounds ||= []
    // from -x, z to x, y
    this.bounds[0] = -this.origin.x
    this.bounds[1] = this.origin.y
    this.bounds[2] = clipSize
    this.bounds[3] = clipSize

    const txMin = Math.floor(this.bounds[0] / tileSize)
    const txMax = txMin + Math.ceil(clipSize / tileSize)
    const tyMin = Math.floor(this.bounds[1] / tileSize)
    const tyMax = tyMin + Math.ceil(clipSize / tileSize)

    const preload = 1
    for (let y = tyMin - preload; y <= tyMax + preload; y += 1) {
      for (let x = txMin - preload; x <= txMax + preload; x += 1) {
        if (x < 0 || y < 0) {
          continue
        }
        let tile = findTile(this.tiles, x, y)
        if (!tile) {

          tile = {
            x,
            y,
            z: this.index + 1,
            intersection: IntersectionType.Disjoint,
            tx: 0,
            ty: 0,
            ts: 1,
            ready: false,
            bounds: [x * tileSize, y * tileSize, tileSize, tileSize],
          }

          this.tiles.push(tile)
          this.updateTile(tile)
        }
      }
    }

    for (const tile of this.tiles) {
      if (tile.x < txMin || tile.x > txMax || tile.y < tyMin || tile.y > tyMax) {
        tile.intersection = IntersectionType.Disjoint
      } else {
        tile.intersection = IntersectionType.Intersects
        this.updateTile(tile)
      }
    }

    if (this.index === 0) {
      // console.log('clipmap tiles', this.index, this.tiles)
    }
  }

  private toRemove: ClipmapTile[] = []
  private removeStaleTiles() {
    this.toRemove.length = 0
    for (const tile of this.tiles) {
      if (tile.texture && tile.ready && !tile.intersection) {
        this.toRemove.push(tile)
      }
    }
    while (this.toRemove.length) {
      const tile = this.toRemove.pop()
      const index = this.tiles.indexOf(tile)
      if (index >= 0) {
        this.tiles.splice(index, 1)
      }
      tile.texture?.dispose()
      tile.texture = null
      tile.texture2?.dispose()
      tile.texture2 = null
      tile.intersection = IntersectionType.Disjoint
    }
  }

  private updateTile(tile: ClipmapTile) {
    tile.tx = (tile.bounds[0] - this.bounds[0]) / this.bounds[2]
    tile.ty = (tile.bounds[1] - this.bounds[1]) / this.bounds[3]
    tile.ts = 1 // this.clip.density

    if (tile.texture) {
      return
    }

    const addrY = tile.y * this.density
    const addrX = tile.x * this.density
    const url = `/nwbt/level/${this.levelName}/heightmap/${tile.z}_${addrY}_${addrX}.png`
    tile.texture = this.loader.load(url, () => {
      tile.ready = true
      this.needsUpdate = true
    })
  }

  private updateHeightmap(renderer: WebGLRenderer) {
    const restoreRt = renderer.getRenderTarget()
    renderer.setRenderTarget(this.heightmap)
    renderer.clear()
    for (const tile of this.tiles) {
      if (tile.intersection && tile.ready) {
        this.heightmapMaterial.texture1 = tile.texture
        this.heightmapMaterial.setOffset(tile.tx, tile.ty)
        this.heightmapMaterial.setScale(tile.ts)
        this.heightmapQuad.render(renderer)
      }
    }
    renderer.setRenderTarget(restoreRt)
  }
}

export function createClipmapMeshes(vertexPerSide: number, material: Material) {
  const n = vertexPerSide
  // check if n+1 is power of 2
  if (n < 3 || ((n + 1) & n) != 0) {
    throw new Error('vertexPerSide + 1 must be power of 2')
  }

  const m = (n + 1) / 4
  const blockEvn = createWxH(m, m, new Color(0.25, 0.75, 0.5), false)
  const blockOdd = createWxH(m, m, new Color(1, 0.5, 0.5), true)
  const fixEV = createWxH(3, m, new Color(0.5, 0.75, 0.75), false)
  const fixOV = createWxH(3, m, new Color(0.5, 0.75, 0.75), true)
  const fixEH = createWxH(m, 3, new Color(0.5, 0.75, 0.75), false)
  const fixOH = createWxH(m, 3, new Color(0.5, 0.75, 0.75), true)
  const trimEV = createWxH(2, 2 * m + 1, new Color(0.75, 0.75, 0.5), false)
  const trimOV = createWxH(2, 2 * m + 1, new Color(0.75, 0.75, 0.5), true)
  const trimEH = createWxH(2 * m + 1, 2, new Color(0.75, 0.75, 0.5), false)
  const trimOH = createWxH(2 * m + 1, 2, new Color(0.75, 0.75, 0.5), true)

  const center: Mesh[] = []
  const blocks: Mesh[] = []
  const fixups: Mesh[] = []
  const trims: Mesh[] = []

  function meshWithOffset(name: string, x: number, z: number, geometry: BufferGeometry) {
    const mesh = new Mesh(geometry, material)
    mesh.name = name
    mesh.position.x = x
    mesh.position.z = z
    // threejs uses a bounding sphere for culling
    // sphere is not suitable for our case
    // disable frustum culling
    mesh.frustumCulled = false
    geometry.computeBoundingBox()
    geometry.boundingBox.min.y = Number.NEGATIVE_INFINITY
    geometry.boundingBox.max.y = Number.POSITIVE_INFINITY

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

function createWxH(w: number, h: number, color: Color, odd: boolean = false) {
  const indices: number[] = []
  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  const uv: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      positions.push(x, 0, y)
      normals.push(0, 1, 0)
      colors.push(color.r, color.g, color.b)
      uv.push(x / w, y / h)
    }
  }

  let i = 0
  for (let y = 0; y < h - 1; y++) {
    let colOdd = odd
    for (let x = 0; x < w - 1; x++) {
      i = y * w + x
      if (colOdd) {
        indices.push(i, i + w + 1, i + 1)
        indices.push(i, i + w, i + w + 1)
      } else {
        indices.push(i, i + w, i + 1)
        indices.push(i + w, i + w + 1, i + 1)
      }
      colOdd = !colOdd
    }
    odd = !odd
  }

  const geometry = new BufferGeometry()
  geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  // geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  return geometry
}

function findTile(tiles: ClipmapTile[], x: number, y: number) {
  for (const tile of tiles) {
    if (tile.x === x && tile.y === y) {
      return tile
    }
  }
  return null
}
