import { EntityInfo, LevelInfo, RegionReference, TerrainInfo } from '@nw-serve'
import { Matrix4 } from 'three'
import { GameComponent, GameEntity, GameEntityCollection } from '../../../ecs'
import { GridProvider } from '../../services/grid-provider'
import { InstancedMeshProvider } from '../../services/instanced-mesh-provider'
import { GridCellComponent } from '../grid-cell-component'
import { StaticShapeComponent } from '../static-shape-component'
import { TransformComponent } from '../transform-component'
import { RegionComponent } from './region-component'

export interface LevelOptions {
  level: LevelInfo
  heightmap: TerrainInfo
  mission: EntityInfo[]
}

export class LevelComponent implements GameComponent {
  private data: LevelOptions
  private terrain: GameEntity
  private regions = new GameEntityCollection()
  private mission = new GameEntityCollection()
  private transform: TransformComponent

  public readonly entity: GameEntity

  public constructor(data: LevelOptions) {
    this.data = data
  }

  public initialize(entity: GameEntity): void {
    setReadOnly(this, 'entity', entity)
    this.transform = entity.component(TransformComponent)

    this.createRegions(this.data.level.regions)

    this.terrain?.initialize(this.entity.game)
    this.regions.initialize(this.entity.game)
    this.mission.initialize(this.entity.game)
  }

  public activate(): void {
    this.regions.activate()
    this.terrain?.activate()
    this.mission.activate()
  }

  public deactivate(): void {
    this.regions.deactivate()
    this.terrain?.deactivate()
    this.mission.deactivate()
  }

  public destroy(): void {
    this.regions.destroy()
    this.terrain?.destroy()
    this.mission.destroy()
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
        }),
        new GridCellComponent({
          color: 0xffff00,
        }),
      )
  }
}

function setReadOnly<T, K extends keyof T>(target: T, key: K, value: T[K]) {
  target[key] = value
}
