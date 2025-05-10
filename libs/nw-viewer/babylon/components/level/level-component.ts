import { Scene, Vector3 } from '@babylonjs/core'
import { EntityInfo, LevelInfo, RegionReference, TerrainInfo } from '@nw-serve'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { TerrainComponent } from '../terrain/terrain-component'
import { TransformComponent } from '../transform-component'
import { instantiateEntities } from './instantiate-entities'
import { RegionComponent } from './region-component'

export interface LevelOptions {
  level: LevelInfo
  heightmap: TerrainInfo
  mission: EntityInfo[]
}

export class LevelComponent implements GameComponent {
  private data: LevelOptions
  private scene: Scene
  private regions = new GameEntityCollection()
  private terrain: GameEntity
  private mission = new GameEntityCollection()
  private transform: TransformComponent

  public entity: GameEntity

  public constructor(data: LevelOptions) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    // HINT: level component is instantiated by LevelProvider
    // do not import LevelProvider to avoid circular dependency

    this.entity = entity
    this.scene = entity.service(SceneProvider).main
    this.transform = entity.component(TransformComponent)

    this.createTerrainEntity()
    for (const data of this.data.level.regions) {
      this.createRegionEntity(data)
    }
    if (this.data.mission) {
      instantiateEntities(this.mission, this.data.mission, this.transform)
    }

    this.terrain?.initialize(this.entity.game)
    this.regions.initialize(this.entity.game)
    this.mission.initialize(this.entity.game)
  }

  public activate(): void {
    this.scene.getEngine().runRenderLoop(this.update)
    this.regions.activate()
    this.terrain?.activate()
    this.mission.activate()
  }

  public deactivate(): void {
    this.scene.getEngine().stopRenderLoop(this.update)
    this.regions.deactivate()
    this.terrain?.deactivate()
    this.mission.deactivate()
  }

  public destroy(): void {
    this.regions.destroy()
    this.terrain?.destroy()
    this.mission.destroy()
  }

  private update = () => {
    //
  }

  private createTerrainEntity() {
    if (!!this.entity.has(TerrainComponent)) {
      return null
    }
    const heightmap = this.data.heightmap
    if (!heightmap || !heightmap.mipCount || heightmap.oceanLevel < 0) {
      return null
    }
    this.terrain = this.entity.game.createEntity()
    this.terrain.addComponents(
      new TransformComponent({
        transform: this.transform.createChild('terrain'),
      }),
      new TerrainComponent(heightmap),
    )
  }

  private createRegionEntity(region: RegionReference) {
    const level = this.data.level
    const location = region.location
    const regionSize = level.regionSize
    const cx = (location[0] + 0.5) * regionSize
    const cy = (-location[1] + 0.5) * regionSize

    this.regions.create().addComponents(
      new TransformComponent({
        // keep region transform at level origin, regardless of region location
        // this only acts as a "folder" node and should not affect the region assets
        transform: this.transform.createChild(region.name),
      }),
      new RegionComponent({
        levelName: level.name,
        regionName: region.name,
        regionSize: regionSize,
        centerX: cx,
        centerY: cy,
      }),
      new DebugMeshComponent({
        position: new Vector3(cx, 0.05, cy),
        size: regionSize * 0.99,
        type: 'ground',
        name: region.name,
      }),
    )
  }
}
