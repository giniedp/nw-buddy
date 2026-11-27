import { type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { vec3, vec3$multiplyScalar } from '@gglib/math'

import { TransformComponent } from '@gglib/components'
import type { LevelInfo, RegionLocation } from '../../api'
import { ResourceScopeComponent } from '../../content'
import { parseTeleport, type LevelCamera } from '../../levels/catalog'
import { RegionComponent, regionEntityOptions } from '../region/RegionComponent'
import { TerrainComponent } from '../terrain/TerrainComponent'

export interface LevelRegionLink {
  entity: GameEntity
  component: RegionComponent
}

/**
 * The spawn position of a level, `TeamTeleportData` of its game mode map (the first team's), null without one
 */
export function levelSpawnPosition(info: LevelInfo): LevelCamera | null {
  for (const map of info.gameModeMaps ?? []) {
    const spawn = parseTeleport(String(map.teamTeleportData ?? ''))
    if (spawn) {
      return spawn
    }
  }
  return null
}

export function levelEntityOptions(parent: GameEntity, options: LevelInfo): CreateEntityOptions {
  return {
    parent,
    name: `Level ${options.name}`,
    transform: new TransformComponent({}),
    components: [new LevelComponent(options), new ResourceScopeComponent('level')],
  }
}

export class LevelComponent implements GameComponent {
  public readonly data: LevelInfo
  public readonly entity: GameEntity

  public sky: GameEntity
  public terrain: GameEntity
  public get hasTerrain() {
    return this.data.mountainHeight > 256
  }

  public constructor(data: LevelInfo) {
    this.data = data
  }

  public initialize(): void {
    this.createTerrain()
    this.createRegions(this.data.regions)
  }

  public activate(): void {
    //
  }

  public destroy(): void {
    //
  }

  private createTerrain() {
    if (!this.hasTerrain) {
      return
    }
    this.entity.world.createEntity({
      name: 'Terrain',
      parent: this.entity,
      transform: new TransformComponent(),
      components: [
        new TerrainComponent({
          regionSize: this.data.regionSize,
        }),
      ],
    })
  }

  private createRegions(regions: RegionLocation[]) {
    if (!regions?.length) {
      return
    }
    for (const region of regions) {
      this.createRegion(region)
    }
  }

  private createRegion(region: RegionLocation) {
    const location = region.location
    const regionSize = this.data.regionSize
    const cellSize = this.data.regionCellSize
    const options = regionEntityOptions(this.entity, {
      coatlicueName: this.data.name,
      regionName: region.name,
      regionSize,
      cellSize,
      origin: vec3$multiplyScalar(vec3(location, 0), regionSize),
      mountainHeight: this.data.mountainHeight,
      oceanLevel: this.data.oceanLevel,
      // the level flags enable the feature, the region flags tell whether the region has the file at all
      // (missing on older nwbt versions)
      enableDistribution: this.data.enableDistribution && region.hasDistribution !== false,
      enableVegetation: this.data.enableVegetation && region.hasVegetation !== false,
      enableChunks: this.data.enableChunks,
      enableTerrain: this.hasTerrain,
    })
    this.entity.world.createEntity(options)
  }
}
