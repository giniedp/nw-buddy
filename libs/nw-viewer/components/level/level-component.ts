import { Scene, Vector3 } from '@babylonjs/core'
import { GameComponent, GameEntity, GameEntityCollection } from '../../ecs'
import { LevelData, RegionMetadata } from './types'
import { SceneProvider } from '../../services/scene-provider'
import { DebugMeshComponent } from '../debug-mesh-component'
import { RegionComponent } from './region-component'
import { TerrainComponent } from '../terrain/terrain-component'
import { TransformComponent } from '../transform-component'

export class LevelComponent implements GameComponent {
  private data: LevelData
  private scene: Scene
  private regions = new GameEntityCollection()
  private terrain: GameEntity
  private transform: TransformComponent

  public entity: GameEntity

  public constructor(data: LevelData) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    // HINT: level component is instantiated by LevelProvider
    // do not import LevelProvider to avoid circular dependency

    this.entity = entity
    this.scene = entity.game.system(SceneProvider).main
    this.transform = entity.component(TransformComponent)

    this.createTerrainEntity()
    for (const data of this.data.regions) {
      this.createRegionEntity(data)
    }

    this.terrain?.initialize(this.entity.game)
    this.regions.initialize(this.entity.game)
    console.log('level initialized', this)
  }

  public activate(): void {
    this.scene.getEngine().runRenderLoop(this.update)
    this.regions.activate()
    this.terrain?.activate()
  }

  public deactivate(): void {
    this.scene.getEngine().stopRenderLoop(this.update)
    this.regions.deactivate()
    this.terrain?.deactivate()
  }

  public destroy(): void {
    this.regions.destroy()
    this.terrain?.destroy()
  }

  private update = () => {
    //
  }

  private createTerrainEntity() {
    if (!!this.entity.optionalComponent(TerrainComponent)) {
      return null
    }
    if (!this.data.heightmap?.mipCount) {
      return null
    }
    this.terrain = this.entity.game.createEntity()
    this.terrain.addComponents(
      new TransformComponent({
        transform: this.transform.createChild('terrain'),
      }),
      new TerrainComponent(this.data.heightmap),
    )
  }

  private createRegionEntity(region: RegionMetadata) {
    const location = this.data.meta.regions.find((el) => el.name === region.name).location
    if (!location) {
      console.warn(`No location found for region:`, region.name)
      return
    }
    const regionSize = region.mapSettings.regionSize
    const cx = (location[0] + 0.5) * regionSize
    const cy = (location[1] + 0.5) * regionSize

    this.regions.create().addComponents(
      new TransformComponent({
        // keep region transform at level origin, regardless of region location
        // this only acts as a "folder" node and should not affect the region assets
        transform: this.transform.createChild(region.name),
      }),
      new RegionComponent({
        ...region,
        centerX: cx,
        centerY: cy,
      }),
      new DebugMeshComponent({
        position: new Vector3(cx, 0.05, cy),
        size: region.mapSettings.regionSize * 0.99,
        type: 'ground',
        name: region.name,
      }),
    )
  }
}
