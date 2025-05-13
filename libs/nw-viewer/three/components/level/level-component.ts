import { EntityInfo, LevelInfo, MapInfo, RegionReference, TerrainInfo } from '@nw-serve'
import { Box3, Box3Helper, Matrix4, PlaneGeometry, RepeatWrapping, TextureLoader, Vector3 } from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { GridProvider } from '../../services/grid-provider'
import { InstancedMeshProvider } from '../../services/instanced-mesh-provider'
import { GridCellComponent } from '../grid-cell-component'
import { StaticShapeComponent } from '../static-shape-component'
import { TransformComponent } from '../transform-component'
import { RegionComponent } from './region-component'
import { SceneProvider } from '../../services/scene-provider'
import { cryToGltfVec3 } from '../../../math/mat4'

export interface LevelOptions {
  level: LevelInfo
  mapName: string
  heightmap: TerrainInfo
  mission: EntityInfo[]
}

export class LevelComponent implements GameComponent {
  private data: LevelOptions
  private terrain: GameEntity
  private regions = new GameEntityCollection()
  private mission = new GameEntityCollection()
  private transform: TransformComponent
  private bounds: [number, number, number, number]
  private boundsBox: Box3
  private boundsHelper: Box3Helper
  private water: Water
  private scene: SceneProvider
  public readonly entity: GameEntity

  public constructor(data: LevelOptions) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)
    this.transform = entity.component(TransformComponent)
    this.scene = entity.service(SceneProvider)

    this.bounds = getMapWorldBounds(this.data.level, this.data.mapName)
    this.createWorldBounds()

    this.createRegions(this.data.level.regions)
    this.terrain?.initialize(this.entity.game)
    this.regions.initialize(this.entity.game)
    this.mission.initialize(this.entity.game)
    // if (this.data.heightmap?.oceanLevel > 0) {
    //   this.createOcean()
    // }
  }

  public activate(): void {
    this.regions.activate()
    this.terrain?.activate()
    this.mission.activate()
    // if (this.boundsHelper) {
    //   this.scene.main.attach(this.boundsHelper)
    // }
    this.scene.renderer.onDraw.add(this.update)
  }

  public deactivate(): void {
    this.boundsHelper?.removeFromParent()
    this.scene.renderer.onDraw.remove(this.update)
    this.regions.deactivate()
    this.terrain?.deactivate()
    this.mission.deactivate()
  }

  public destroy(): void {
    this.boundsHelper?.dispose()
    this.regions.destroy()
    this.terrain?.destroy()
    this.mission.destroy()
    this.water?.removeFromParent()
    this.water?.material?.dispose()
    this.water?.geometry?.dispose()
    this.water = null
  }

  private createRegions(regions: RegionReference[]) {
    if (!regions) {
      return
    }
    for (const region of regions) {
      this.createRegion(region)
    }
  }

  private createRegion(region: RegionReference) {
    const level = this.data.level
    const location = region.location
    const regionSize = level.regionSize
    const centerX = (-location[0] - 0.5) * regionSize
    const centerY = (location[1] + 0.5) * regionSize

    this.regions
      .create()
      .withServices(new InstancedMeshProvider(`Region [${location[0]};${location[1]}] shapes`), new GridProvider())
      .addComponents(
        new TransformComponent({
          name: `Region [${location[0]};${location[1]}]`,
          parent: this.transform.node,
          matrix: new Matrix4().setPosition(centerX, 0.05, centerY),
          matrixIsWorld: true,
        }),
        new StaticShapeComponent({
          scale: regionSize,
          type: 'ground',
        }),
        new RegionComponent({
          levelName: level.name,
          regionName: region.name,
          regionSize: regionSize,
          centerX: centerX,
          centerY: centerY,
          worldBounds: this.boundsBox,
        }),
        new GridCellComponent({
          color: 0xffff00,
        }),
      )
  }

  private createOcean() {
    const geometry = new PlaneGeometry(10000, 10000)
    this.water = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new TextureLoader().load('https://assets.babylonjs.com/textures/waterbump.png', (texture) => {
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
      }),
      sunDirection: new Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,

      fog: true,
    })
    this.water.rotation.x = -Math.PI / 2
    this.water.position.y = this.data.heightmap.oceanLevel
    this.transform.node.add(this.water)
  }

  private cp = new Vector3()
  private update = (dt: number) => {
    this.scene.camera.getWorldPosition(this.cp)
    if (this.water) {
      this.water.material.uniforms['time'].value += dt * 0.001
      this.water.position.x = this.cp.x
      this.water.position.z = this.cp.z
    }
  }

  private createWorldBounds() {
    if (!this.bounds) {
      return
    }
    const bounds = getMapExtent(this.bounds)
    if (!bounds) {
      return
    }
    this.boundsBox = bounds
    this.boundsHelper = new Box3Helper(bounds, 0xffff00)
  }
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}

function getMapExtent(bounds: [number, number, number, number]): Box3 {
  const p0 = new Vector3(...cryToGltfVec3([bounds[0], bounds[1], 0]))
  const p1 = new Vector3(...cryToGltfVec3([bounds[0] + bounds[2], bounds[1] + bounds[3], 2048]))
  const box = new Box3()
  box.setFromPoints([p0, p1])
  return box
}

function getMapWorldBounds(info: LevelInfo, map: string): [number, number, number, number] {
  if (!info || !info.maps || !map) {
    return null
  }
  const mapInfo = info.maps.find((it) => it.gameModeMapId.toLowerCase() === map.toLowerCase())
  if (!mapInfo || !mapInfo.worldBounds) {
    console.warn('map not found ', map)
    return null
  }
  const bounds = mapInfo.worldBounds.split(',').map(Number)
  if (bounds.length !== 4) {
    console.warn('Invalid world bounds', mapInfo.worldBounds)
    return null
  }
  if (bounds.some((it) => !Number.isFinite(it) || Number.isNaN(it))) {
    console.warn('Invalid world bounds', mapInfo.worldBounds)
    return null
  }
  return bounds as [number, number, number, number]
}
