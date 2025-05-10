import { Mesh, RenderTargetTexture, Texture } from '@babylonjs/core'
import { GameComponent, GameEntity } from '../../../ecs'
import { IntersectionType } from '../../../math'
import { ContentProvider } from '../../services/content-provider'
import { SceneProvider } from '../../services/scene-provider'
import { TransformComponent } from '../transform-component'
import { Clipmap } from './clipmap'
import { ClipmapGeometry, clipmapGeometry } from './clipmap-geometry'
import { ClipmapUpdateMaterial } from './clipmap-update-shader'

export interface ClipmapComponentOptions {
  index: number
  size: number
  levelName: string
  tileSize: number
  mountainHeight: number
  previous: ClipmapComponent
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

  mesh: Mesh
  material: ClipmapUpdateMaterial
  bounds: number[]
}

export class ClipmapComponent implements GameComponent {
  public entity: GameEntity
  private levelName: string
  private tileSize: number
  private mountainHeight: number

  private scene: SceneProvider
  private transform: TransformComponent
  private clip: Clipmap
  private geometry: ClipmapGeometry

  private tiles: ClipmapTile[] = []
  private content: ContentProvider
  private heightmap: RenderTargetTexture
  private heightmapSize: number
  private groundmap: RenderTargetTexture
  private needsUpdate: boolean = true
  private bounds: number[] = [0, 0, 0, 0]
  private previous: ClipmapComponent
  public constructor(options: ClipmapComponentOptions) {
    this.tileSize = options.tileSize
    this.levelName = options.levelName
    this.mountainHeight = options.mountainHeight
    this.previous = options.previous

    this.clip = new Clipmap({
      index: options.index,
      vertexPerSide: Math.pow(2, options.size) - 1,
    })
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = this.entity.service(SceneProvider)
    this.content = this.entity.service(ContentProvider)
    this.transform = this.entity.component(TransformComponent)
    this.geometry = clipmapGeometry(this.scene.main, this.clip.clipsize)

    this.heightmapSize = this.clip.clipsize + 1
    this.heightmap = new RenderTargetTexture(
      `clipmap-${this.clip.index}`,
      {
        width: this.heightmapSize,
        height: this.heightmapSize,
      },
      this.scene.main,
      {
        generateDepthBuffer: false,
        samplingMode: Texture.LINEAR_LINEAR,
      },
    )
    this.groundmap = new RenderTargetTexture(
      `groundmap-${this.clip.index}`,
      {
        width: 1024,
        height: 1024,
      },
      this.scene.main,
      {
        generateDepthBuffer: false,
        samplingMode: Texture.LINEAR_LINEAR,
      },
    )
  }

  public activate(): void {
    this.scene.main.onBeforeRenderObservable.add(this.update)
    for (const mesh of this.geometry.center) {
      mesh.parent = this.transform.node
      mesh.setEnabled(true)
    }
    for (const mesh of this.geometry.blocks) {
      mesh.parent = this.transform.node
      mesh.setEnabled(true)
    }
    for (const mesh of this.geometry.fixups) {
      mesh.parent = this.transform.node
      mesh.setEnabled(true)
    }
    for (const mesh of this.geometry.trims) {
      mesh.parent = this.transform.node
      mesh.setEnabled(true)
    }
  }

  public deactivate(): void {
    this.scene.main.onBeforeRenderObservable.removeCallback(this.update)
    for (const mesh of this.geometry.center) {
      mesh.parent = null
      mesh.setEnabled(false)
    }
    for (const mesh of this.geometry.blocks) {
      mesh.parent = null
      mesh.setEnabled(false)
    }
    for (const mesh of this.geometry.fixups) {
      mesh.parent = null
      mesh.setEnabled(false)
    }
    for (const mesh of this.geometry.trims) {
      mesh.parent = null
      mesh.setEnabled(false)
    }
  }

  public destroy(): void {
    for (const mesh of this.geometry.center) {
      mesh.dispose()
    }
    for (const mesh of this.geometry.blocks) {
      mesh.dispose()
    }
    for (const mesh of this.geometry.fixups) {
      mesh.dispose()
    }
    for (const mesh of this.geometry.trims) {
      mesh.dispose()
    }
    for (const tile of this.tiles) {
      tile.mesh.dispose()
      tile.material.dispose()
    }
    this.tiles.length = 0
    this.geometry = null
  }

  private update = () => {
    const position = this.scene.main.activeCamera.position
    this.clip.update(position)
    this.needsUpdate = this.needsUpdate || this.clip.delta.lengthSquared() > 0

    this.transform.node.position.set(this.clip.center.x, 0, this.clip.center.y)
    this.transform.node.scaling.setAll(this.clip.density)

    for (const mesh of this.geometry.center) {
      mesh.setEnabled(this.clip.index === 0)
    }
    if (this.clip.index === 0) {
      this.geometry.trims[0].setEnabled(true)
      this.geometry.trims[1].setEnabled(true)
      this.geometry.trims[2].setEnabled(true)
      this.geometry.trims[3].setEnabled(true)
    } else {
      const xIsEven = Math.floor(position.x / this.clip.density) % 2 === 0
      const zIsEven = Math.floor(position.z / this.clip.density) % 2 === 0
      this.geometry.trims[0].setEnabled(!zIsEven)
      this.geometry.trims[1].setEnabled(xIsEven)
      this.geometry.trims[2].setEnabled(zIsEven)
      this.geometry.trims[3].setEnabled(!xIsEven)
    }

    this.geometry.material.params.setClipSize(this.clip.clipsize)
    this.geometry.material.params.setClipDensity(this.clip.density)
    this.geometry.material.params.setClipCenter(this.clip.center)
    this.geometry.material.params.setClipOrigin(this.clip.origin)
    this.geometry.material.params.setCoarseCenter(this.previous?.clip?.center || this.clip.center)
    this.geometry.material.params.setCoarseOrigin(this.previous?.clip?.origin || this.clip.origin)
    this.geometry.material.params.setEyePosition(position)

    if (this.needsUpdate) {
      this.needsUpdate = false
      this.detectTiles()
      this.geometry.material.params.setHeightmap(this.heightmap)
      this.geometry.material.params.setCoarseMap(this.previous?.heightmap)
      this.geometry.material.params.setHeightmapTexel(1 / this.heightmapSize)
      this.geometry.material.params.setGroundmap(this.groundmap)
      this.geometry.material.params.setMountainHeight(this.mountainHeight)
      this.updateHeightmap()
    }
  }

  private detectTiles() {
    const tileSize = this.tileSize * this.clip.density
    const clipSize = this.heightmapSize * this.clip.density
    this.bounds = this.bounds || []
    this.bounds[0] = this.clip.origin.x
    this.bounds[1] = this.clip.origin.y
    this.bounds[2] = clipSize
    this.bounds[3] = clipSize

    const txMin = Math.floor(this.clip.origin.x / tileSize)
    const txMax = txMin + Math.ceil(clipSize / tileSize)
    const tyMin = Math.floor(this.clip.origin.y / tileSize)
    const tyMax = tyMin + Math.ceil(clipSize / tileSize)

    const tileFolder = this.transform.node.parent
    const border = 1
    for (let y = tyMin - border; y <= tyMax + border; y += 1) {
      for (let x = txMin - border; x <= txMax + border; x += 1) {
        if (x < 0 || y < 0) {
          continue
        }
        let tile = findTile(this.tiles, x, y)
        if (!tile) {
          const material = new ClipmapUpdateMaterial(`clipmap update`, this.scene.main)
          const mesh = new Mesh(`clipmap-tile-${x}-${y}`, this.scene.main, {
            source: this.scene.screenQuadMesh,
            parent: tileFolder,
          })
          mesh.setEnabled(false)
          mesh.material = material
          tile = {
            x,
            y,
            z: this.clip.index + 1,
            intersection: IntersectionType.Disjoint,
            mesh: mesh,
            material: material,
            tx: 0,
            ty: 0,
            ts: 1,
            bounds: [x * tileSize, y * tileSize, tileSize, tileSize],
          }
          this.tiles.push(tile)
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
  }

  private updateTile(tile: ClipmapTile) {
    tile.tx = (tile.bounds[0] - this.bounds[0]) / this.bounds[2]
    tile.ty = (tile.bounds[1] - this.bounds[1]) / this.bounds[3]
    tile.ts = 1 // this.clip.density

    if (tile.texture) {
      return
    }
    ;('newworld_vitaeeterna/.webp')
    const addrY = tile.y * this.clip.density
    const addrX = tile.x * this.clip.density
    const url = `${this.content.nwbtUrl}/level/${this.levelName}/heightmap/${tile.z}_${addrY}_${addrX}.png`
    tile.texture = new Texture(url, this.scene.main, true, false, Texture.NEAREST_NEAREST, () => {
      this.needsUpdate = true
    })
    const url2 = `http://localhost:4200/nw-data/lyshineui/worldtiles/${this.levelName}/map_l${tile.z}_y${String(addrY).padStart(3, '0')}_x${String(addrX).padStart(3, '0')}.webp`
    tile.texture2 = new Texture(url2, this.scene.main, true, false, Texture.LINEAR_LINEAR, () => {
      this.needsUpdate = true
    })
  }

  private toRemove: ClipmapTile[] = []
  private updateHeightmap() {
    this.heightmap.renderList.length = 0
    this.groundmap.renderList.length = 0
    this.toRemove.length = 0
    for (const tile of this.tiles) {
      if (tile.texture && !tile.intersection) {
        this.toRemove.push(tile)
      }
      if (!tile.intersection || !tile.texture) {
        continue
      }

      tile.mesh.position.x = tile.tx
      tile.mesh.position.y = tile.ty
      tile.mesh.scaling.setAll(tile.ts)
      tile.mesh.position.z = 0
      this.heightmap.renderList.push(tile.mesh)
      tile.mesh.setEnabled(true)
      tile.material.params.setTexture(tile.texture)
      tile.mesh.material = tile.material
    }
    this.heightmap.activeCamera = this.scene.screenQuadCamera
    this.heightmap.render(false, false)

    for (const tile of this.tiles) {
      if (!tile.intersection || !tile.texture) {
        continue
      }

      this.groundmap.renderList.push(tile.mesh)
      tile.material.params.setTexture(tile.texture2)
      tile.mesh.material = tile.material
    }
    this.groundmap.activeCamera = this.scene.screenQuadCamera
    this.groundmap.render(false, false)

    for (const item of this.heightmap.renderList) {
      item.setEnabled(false)
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
      tile.mesh.parent = null
      tile.mesh.setEnabled(false)
      tile.mesh.material.dispose()
      tile.mesh.dispose()
    }
  }
}

function findTile(tiles: ClipmapTile[], x: number, y: number) {
  for (const tile of tiles) {
    if (tile.x === x && tile.y === y) {
      return tile
    }
  }
  return null
}
