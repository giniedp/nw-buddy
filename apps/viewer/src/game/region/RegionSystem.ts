import { EcsGame } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import { BoundingFrustum, boxMat4DistanceSquared, frustumBoxIntersects, vec3, vec3$initFrom } from '@gglib/math'
import type { CameraData } from '@gglib/render'
import { ViewerConfig } from '../../config'
import {
  GDE_NEAR_SWEEP,
  OBJECT_DETAIL_TIERS,
  RANGE_ACTIVATION_BUDGET_MS,
  RANGE_HYSTERESIS,
  type ObjectDetailValues,
} from '../../constants'
import { DistributionComponent } from '../distribution/DistributionComponent'
import type { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { executeSpawner, resolveSpawnData } from '../slice/SliceSystem'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import { VegetationComponent } from '../vegetation/VegetationComponent'
import { RegionComponent } from './RegionComponent'
import { RegionImpostorComponent } from './RegionImpostorComponent'

export class RegionSystem extends GameSystem {
  private allRegions: GameQuery
  private activeRegions: GameQuery
  private activeImpostor: GameQuery

  private game: EcsGame
  private world: GameWorld
  private frustum = new BoundingFrustum()
  private config: ViewerConfig | null = null

  public get regionCount() {
    return this.allRegions.count()
  }

  public get activeRegionCount() {
    return this.activeRegions.count()
  }

  public get activeImpostorCount() {
    return this.activeImpostor.count()
  }

  public updateTime: number

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.config = world.getSystem(ViewerConfig, { optional: true })
    this.allRegions = world.query({ scope: 'all', required: [RegionComponent] })
    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
    this.activeImpostor = world.query({ scope: 'active', required: [RegionImpostorComponent] })

    world.eventBus.on(GameEntity.onInitialized, addRegionTag)
  }

  public destroy(): void {
    this.world.eventBus.off(GameEntity.onInitialized, addRegionTag)
  }

  public update() {
    const start = performance.now()
    const camera = this.game.scene.getView(0).camera
    this.frustum.updateFromViewProjection(camera.view, camera.projection)

    // activate / deactivate regions
    // activate / deactivate impostor cells
    const tier = OBJECT_DETAIL_TIERS[this.config?.value.objectDetail ?? 'high']
    activateRegions(camera, this.frustum, this.allRegions, tier)
    loadRegionData(this.activeRegions)
    updateActiveImpostor(this.activeImpostor, start + RANGE_ACTIVATION_BUDGET_MS)

    this.updateTime = performance.now() - start
  }
}

// #region Region Tag

function addRegionTag(entity: GameEntity) {
  const root = entity.component(RegionComponent, GetComponent.OptionalFollowParent)
  if (root && !entity.has(root.Tag)) {
    // prettier-ignore
    entity.addComponent(
      new root.Tag(), // instance
      root.Tag, // instance type
      RegionComponent.Tag, // alias type, so it can be found without knowing the instance type
    )
  }
}

// #endregion

const loadMin = vec3()
const loadMax = vec3()
function isImpostorVisible(frustum: BoundingFrustum, impostor: RegionImpostorComponent) {
  const margin = Math.abs(impostor.max.x - impostor.min.x)
  vec3$initFrom(loadMin, impostor.min)
  vec3$initFrom(loadMax, impostor.max)
  loadMin.x -= margin
  loadMin.y -= margin
  loadMax.x += margin
  loadMax.y += margin
  return frustumBoxIntersects(frustum, loadMin, loadMax)
}

function activateRegions(camera: CameraData, frustum: BoundingFrustum, regions: GameQuery, tier: ObjectDetailValues) {
  for (const entity of regions) {
    const region = entity.component(RegionComponent)

    const regionSize = region.regionSize
    const cellSize = region.cellSize

    const activateAt = regionSize * 0.5 - cellSize
    const deactivateAt = regionSize * 0.5

    const distance = Math.sqrt(boxMat4DistanceSquared(region.min, region.max, camera.world))
    if (entity.isActive && distance >= deactivateAt) {
      entity.deactivate()
      deactivateRegionImpostor(region)
      // frees everything the region spawned and loaded
      region.unload()
    }

    if (!entity.isActive && distance <= activateAt) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      region.load()
      entity.activate()
    }

    if (!entity.isActive) {
      continue
    }
    for (const child of region.impostors.getTransform().children) {
      const impostor = child.entity.component(RegionImpostorComponent)
      updateImpostorVisibility(camera, frustum, impostor, tier, region.capitalDataLoaded)
    }
  }
}

function loadRegionData(regions: GameQuery) {
  for (const entity of regions) {
    const region = entity.$(RegionComponent)
    if (region.isLoaded) {
      continue
    }

    if (region.enableTerrain && !region.terrain.$(TerrainRegionComponent).isLoaded) {
      // terrain is still loading
      // try next frame
      continue
    }
    if (region.enableDistribution && !region.distribution.$(DistributionComponent).isLoaded) {
      // distribution is still loading
      // try next frame
      continue
    }
    if (region.enableVegetation) {
      const vegetation = region.vegetation.$(VegetationComponent)
      if (!vegetation.isLoadRequested) {
        vegetation.load()
        continue
      }

      if (!vegetation.isLoaded) {
        // vegetation is still loading
        // try next frame
        continue
      }
    }

    if (!region.regionInfoLoaded) {
      region.loadRegionInfo()
      continue
    }

    if (!region.capitalDataLoaded) {
      region.loadCapitalData()
      continue
    }
  }
}

function updateImpostorVisibility(
  camera: CameraData,
  frustum: BoundingFrustum,
  impostor: RegionImpostorComponent,
  tier: ObjectDetailValues,
  spawnersComplete: boolean,
) {
  const entity = impostor.entity
  const distanceSquared = boxMat4DistanceSquared(impostor.min, impostor.max, camera.world)
  const distance = Math.sqrt(distanceSquared)

  impostor.isVisible = isImpostorVisible(frustum, impostor)
  impostor.distanceSquared = distanceSquared

  // detect and update entity state
  {
    // g_GDE_ImpostorsRenderMaxRange of the object detail tier, cells exist only in the loaded regions
    const loadAt = tier.impostorRange
    const unloadAt = tier.impostorRange * RANGE_HYSTERESIS
    const shouldActivate = !entity.isActive && distance <= loadAt
    const shouldDeactivate = entity.isActive && distance > unloadAt

    if (shouldDeactivate && entity.canDeactivate) {
      entity.deactivate()
    }

    if (shouldActivate) {
      if (entity.canInitialize) {
        entity.initialize()
      }
      entity.activate()
    }
  }

  if (!entity.isActive) {
    return
  }

  // initiate mesh load
  if (!impostor.isModelLoaded) {
    impostor.loadMesh()
  }

  // initiate content load only after mesh was loaded, and after the region created all capital and chunk spawners:
  // they are created over several frames and attached to their cells, a cell that loads earlier would miss some
  if (spawnersComplete && impostor.isModelLoaded && impostor.isPoi && impostor.hasContent) {
    // the cells the GDE near sweep tends: the camera within 225 m plus the cell size of the cell center, on both ground
    // axes. The cell holds its impostor until its content has loaded.
    const cellSize = impostor.max.x - impostor.min.x
    const loadAt = GDE_NEAR_SWEEP + cellSize
    const unloadAt = loadAt * RANGE_HYSTERESIS
    const sweep = Math.max(
      Math.abs(camera.world[12] - (impostor.min.x + impostor.max.x) * 0.5),
      Math.abs(camera.world[13] - (impostor.min.y + impostor.max.y) * 0.5),
    )
    const shouldLoad = impostor.contentState === 'far' && sweep <= loadAt
    const shouldUnload = impostor.contentState !== 'far' && sweep > unloadAt

    if (shouldLoad) {
      impostor.setContentState('loading')
    } else if (shouldUnload) {
      unloadContent(impostor)
    }
  }
}

const pendingImpostor: RegionImpostorComponent[] = []
function byDistance(a: RegionImpostorComponent, b: RegionImpostorComponent) {
  return a.distanceSquared - b.distanceSquared
}
function updateActiveImpostor(query: GameQuery, deadline: number) {
  let index = 0
  for (const entity of query) {
    const impostor = entity.$(RegionImpostorComponent)
    if (impostor.contentState === 'loading') {
      pendingImpostor[index++] = impostor
    }
  }
  pendingImpostor.length = index
  pendingImpostor.sort(byDistance)

  for (const impostor of pendingImpostor) {
    if (updateLoading(impostor, deadline)) {
      impostor.setContentState('ready')
    }
    if (performance.now() > deadline) {
      break
    }
  }
}

function deactivateRegionImpostor(region: RegionComponent) {
  if (!region.impostors) {
    return
  }
  for (const child of region.impostors.getTransform().children) {
    const impostor = child.entity.component(RegionImpostorComponent)
    if (impostor.hasContent && impostor.contentState !== 'far') {
      unloadContent(impostor)
    }
    if (child.entity.canDeactivate) {
      child.entity.deactivate()
    }
  }
}

/**
 * The cell turns far: deactivates its members and despawns the chunks it owns, the impostor shows again
 */
function unloadContent(impostor: RegionImpostorComponent) {
  impostor.deactivateMembers()
  impostor.setContentState('far')
  for (const slice of impostor.slices) {
    if (slice.impostor === impostor) {
      slice.despawn()
    }
  }
}

/**
 * Spawns the owned chunks and activates members until the deadline. Returns true when the cell is ready.
 */
function updateLoading(impostor: RegionImpostorComponent, deadline: number): boolean {
  let spawned = true
  for (const slice of impostor.slices) {
    spawned = spawnSlice(slice) && spawned
  }
  while (impostor.activated < impostor.members.length) {
    activateEntity(impostor.members[impostor.activated].entity)
    impostor.activated++
    if ((impostor.activated & 7) === 0 && performance.now() > deadline) {
      return false
    }
  }

  return spawned && impostor.countPending() === 0
}

function spawnSlice(slice: SliceSpawnerComponent): boolean {
  if (!slice.isSpawned) {
    // top level slice entities are initialized by the SliceSystem
    if (!slice.entity.isInitialized) {
      return false
    }
    resolveSpawnData(slice)
    executeSpawner(slice)
  }
  let spawned = true
  for (const nested of slice.slices) {
    activateEntity(nested.entity)
    spawned = spawnSlice(nested) && spawned
  }
  return spawned
}

function activateEntity(entity: GameEntity) {
  if (entity.canInitialize) {
    entity.initialize()
  }
  if (entity.canActivate) {
    entity.activate()
  }
}
