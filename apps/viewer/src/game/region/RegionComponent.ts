import {
  BoundsComponent,
  EcsGame,
  LifeCycleFlags,
  MeshComponent,
  OccTree,
  PriorityLane,
  SchedulerSystem,
  SpatialComponent,
  TaskCancelledError,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import { GetComponent, type CreateEntityOptions, type GameComponent, type GameEntity, type Type } from '@gglib/ecs'
import {
  mat4CreateFromArray,
  mat4CreateTranslation,
  mat4Invert,
  mat4Multiply,
  vec3,
  vec3AddScalar,
  vec3Copy,
  type IVec3,
  type Mat4,
} from '@gglib/math'

import { Color } from '@gglib/graphics'
import { lfmt } from '@gglib/utils'
import {
  assetReferenceKey,
  ChunkType,
  decodeRegionCapitalsBin,
  getRegionCapitalsBinUrl,
  getRegionInfoUrl,
  isViewerMeshComponent,
  isViewerPointSpawnerComponent,
  isViewerPrefabSpawnerComponent,
  type AssetReference,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type RegionCapitals,
  type RegionImpostor,
  type ViewerMeshComponent,
  type RegionInfo,
} from '../../api'
import {
  CAPITAL_SPAWN_BUDGET_MS,
  ENABLE_CAPITALS,
  ENABLE_CHUNKS,
  ENABLE_IMPOSTOR_POI,
  ENABLE_IMPOSTOR_VEG,
} from '../../constants'
import { ContentService, ResourceScopeComponent } from '../../content'
import { DistributionComponent } from '../distribution/DistributionComponent'
import {
  capitalSliceEntityOptions,
  chunkSliceEntityOptions,
  SliceSpawnerComponent,
} from '../slice/SliceSpawnerComponent'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import { VegetationComponent } from '../vegetation/VegetationComponent'
import { DeferredDestroySystem } from './DeferredDestroySystem'
import { impostorEntityOptions, RegionImpostorComponent } from './RegionImpostorComponent'

/**
 * A capital or a chunk of the region to create a spawner for
 */
interface CapitalSpawnItem {
  layer: string
  capital: CapitalRuntimeData | null
  chunk: ChunkRuntimeData | null
  /**
   * Squared ground distance to the camera when the spawn started
   */
  distance: number
}

function byDistance(a: CapitalSpawnItem, b: CapitalSpawnItem) {
  return a.distance - b.distance
}

export interface RegionComponentOptions {
  coatlicueName: string
  regionName: string
  regionSize: number
  oceanLevel: number
  mountainHeight: number
  cellSize: number
  origin: IVec3
  enableDistribution: boolean
  enableVegetation: boolean
  enableChunks: boolean
  enableTerrain: boolean
}

export function regionEntityOptions(parent: GameEntity, options: RegionComponentOptions): CreateEntityOptions {
  const min = vec3Copy(options.origin)
  const max = vec3AddScalar(options.origin, options.regionSize)

  return {
    name: options.regionName,
    parent,
    transform: new TransformComponent({
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by RegionSystem
      keepWorld: true,
    }),
    components: [
      new BoundsComponent(),
      new MeshComponent(),
      new SpatialComponent({
        index: OccTree.create({
          min,
          max,
          leafLevel: 5,
          looseFactor: 2,
        }),
      }),
      new RegionComponent(options),
    ],
  }
}

export class RegionTagComponent implements GameComponent {
  public region: RegionComponent
  public entity: GameEntity
  public initialize(): void {
    this.region = this.entity.component(RegionComponent, GetComponent.OptionalFollowParent)
  }
  public activate(): void {}
  public deactivate(): void {}
  public destroy(): void {}
}

export class RegionComponent implements GameComponent {
  public static readonly Tag = RegionTagComponent
  public readonly Tag: Type<RegionTagComponent> = class extends RegionTagComponent {}

  public readonly entity: GameEntity
  public readonly coatlicueName: string
  public readonly regionName: string
  public readonly regionSize: number
  public readonly cellSize: number
  public readonly min: IVec3
  public readonly max: IVec3

  public readonly oceanLevel: number
  public readonly mountainHeight: number
  public readonly enableDistribution: boolean
  public readonly enableVegetation: boolean
  public readonly enableChunks: boolean
  public readonly enableTerrain: boolean

  /**
   * POI impostor cells by local cell index
   */
  private poiImpostor: Record<number, RegionImpostorComponent> = {}
  private impostor: Record<number, RegionImpostorComponent> = {}

  private scheduler: SchedulerSystem
  private contentService: ContentService

  /**
   * Root of everything the region spawns while it is active, see {@link load} and {@link unload}.
   * Holds the resource scope of the region, destroying it frees all region resources.
   */
  public content: GameEntity | null = null

  public get isContentLoaded() {
    return !!this.content
  }

  public impostors: GameEntity | null
  public capitals: GameEntity | null
  public terrain: GameEntity | null
  public distribution: GameEntity | null
  public vegetation: GameEntity | null

  public regionInfo: RegionInfo | null
  public regionInfoTask: ScheduledTask | null
  public regionInfoLoaded: boolean

  public capitalData: RegionCapitals | null
  public capitalDataTask: ScheduledTask | null
  public capitalDataLoaded: boolean

  public get isLoaded() {
    return this.regionInfoLoaded && this.capitalDataLoaded
  }

  private capitalLayers: Record<string, GameEntity> = {}
  /**
   * The capitals and chunks the running capital data task still has to create, see {@link loadCapitalData}
   */
  private capitalSpawn: { items: CapitalSpawnItem[]; next: number } | null = null
  /**
   * The content of the last unload, while the DeferredDestroySystem tears it down
   */
  private pendingContent: GameEntity | null = null

  public slices: SliceSpawnerComponent[] = []
  private logTag = lfmt.badge('#4E79A7', 'RegionComponent')

  public get debugColor() {
    if (this.regionInfoTask) {
      return Color.Red
    }
    if (this.capitalDataTask) {
      return Color.DarkRed
    }
    if (this.entity.isActive) {
      return Color.White
    }
    return Color.Black
  }

  public constructor(data: RegionComponentOptions) {
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', `${data.regionName}`))
    this.coatlicueName = data.coatlicueName
    this.regionName = data.regionName
    this.regionSize = data.regionSize
    this.cellSize = data.cellSize
    this.oceanLevel = data.oceanLevel
    this.mountainHeight = data.mountainHeight
    this.enableDistribution = !!data.enableDistribution // && ENABLE_DISTRIBUTION
    this.enableVegetation = !!data.enableVegetation // && ENABLE_VEGETATION
    this.enableChunks = !!data.enableChunks // && ENABLE_CHUNKS
    this.enableTerrain = !!data.enableTerrain
    this.min = vec3Copy(data.origin)
    this.max = vec3AddScalar(data.origin, data.regionSize)
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.contentService = this.entity.service(ContentService)
  }

  /**
   * Creates the content of the region: impostor cells, capitals, terrain, distribution and vegetation.
   * The region data is loaded afterwards by the RegionSystem.
   */
  public load(): void {
    if (this.content) {
      return
    }
    // the region came back before its old content was torn down
    this.finishPendingContent()
    console.log(...this.logTag, 'Load content')
    this.content = this.entity.world.createEntity({
      name: 'Content',
      parent: this.entity,
      transform: new TransformComponent(),
      components: [new ResourceScopeComponent(`region:${this.regionName}`)],
    })

    this.impostors = this.entity.world.createEntity({
      name: 'Impostors',
      parent: this.content,
      transform: new TransformComponent(),
    })

    this.capitals = this.entity.world.createEntity({
      name: 'Capitals',
      parent: this.content,
      transform: new TransformComponent(),
    })

    this.terrain = this.entity.world.createEntity({
      name: 'Terrain',
      parent: this.content,
      transform: new TransformComponent(),
      components: [
        new TerrainRegionComponent({
          regionName: this.regionName,
          coatlicueName: this.coatlicueName,
          origin: vec3Copy(this.min),
          regionSize: this.regionSize,
          mountainHeight: this.mountainHeight,
          regionMaterial: null,
        }),
      ],
    })

    if (this.enableDistribution) {
      this.distribution = this.entity.world.createEntity({
        name: 'Distribution',
        parent: this.content,
        transform: new TransformComponent(),
        components: [
          new MeshComponent(),
          new DistributionComponent({
            coatlicueName: this.coatlicueName,
            regionName: this.regionName,
            regionSize: this.regionSize,
            cellSize: this.cellSize,
            mountainHeight: this.mountainHeight,
            origin: vec3Copy(this.min),
            terrain: this.terrain.component(TerrainRegionComponent),
          }),
        ],
      })
    }

    if (this.enableVegetation) {
      this.vegetation = this.entity.world.createEntity({
        name: 'Vegetation',
        parent: this.content,
        transform: new TransformComponent(),
        components: [
          new MeshComponent(),
          new VegetationComponent({
            coatlicueName: this.coatlicueName,
            regionName: this.regionName,
            regionSize: this.regionSize,
            mountainHeight: this.mountainHeight,
            origin: vec3Copy(this.min),
          }),
        ],
      })
    }
  }

  /**
   * Destroys the content of the region and frees its resources. The region can be loaded again.
   *
   * @param deferred - destroy the content over the next frames (DeferredDestroySystem), else right away
   */
  public unload(deferred = true): void {
    if (!deferred) {
      this.finishPendingContent()
    }
    if (!this.content) {
      return
    }
    console.log(...this.logTag, 'Unload content')
    this.cancelTasks()
    const content = this.content
    this.content = null
    this.impostors = null
    this.capitals = null
    this.terrain = null
    this.distribution = null
    this.vegetation = null
    this.poiImpostor = {}
    this.impostor = {}
    this.capitalLayers = {}
    this.slices = []
    this.regionInfo = null
    this.regionInfoLoaded = false
    this.capitalData = null
    this.capitalDataLoaded = false
    this.capitalSpawn = null
    this.contentService.slices.remove(this)
    if (deferred) {
      // destroys the subtree and disposes the resource scope of the region over the next frames
      this.pendingContent = content
      this.entity.world.getSystem(DeferredDestroySystem).destroyLater(content)
    } else {
      // destroys the subtree and disposes the resource scope of the region
      content.destroy()
      content.setParent(null)
    }
  }

  /**
   * Destroys what is left of the content of the last unload right away
   */
  private finishPendingContent() {
    if (this.pendingContent) {
      this.entity.world.getSystem(DeferredDestroySystem).finish(this.pendingContent)
      this.pendingContent = null
    }
  }

  public destroy(): void {
    // synchronous: the region scope is a child of the level scope, which is disposed together with the level
    this.unload(false)
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    this.cancelTasks()
  }

  private cancelTasks() {
    if (this.regionInfoTask) {
      this.regionInfoTask.cancelled = true
      this.regionInfoTask = null
    }

    if (this.capitalDataTask) {
      this.capitalDataTask.cancelled = true
      this.capitalDataTask = null
    }
    this.capitalSpawn = null
  }

  public poiImpostorAt(x: number, y: number): RegionImpostorComponent | null {
    return this.poiImpostor[this.cellIndex(x, y)] || null
  }

  /**
   * Whether the capital mesh is part of the content of its POI impostor cell, so the cell waits for it.
   *
   * Regions with a region.slicedata flag the meshes baked into the impostor. Regions without (e.g. dungeons)
   * have no such link, there every capital mesh belongs to the cell it is in.
   */
  public isImpostorMesh(comp: ViewerMeshComponent): boolean {
    return !!comp.impostor || this.regionInfo?.hasSliceData === false
  }

  // #region Tasks
  public loadRegionInfo() {
    if (this.regionInfo || this.regionInfoTask || this.regionInfoLoaded) {
      return
    }
    console.log(...this.logTag, 'Loading info')
    this.regionInfoTask = this.scheduler.schedule<RegionInfo>({
      // terrain materials and impostors depend on the region info
      lane: PriorityLane.Critical,
      label: `Load region info ${this.regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await this.contentService.fetchTypedRequest(
          getRegionInfoUrl(this.coatlicueName, this.regionName),
        )
      },
      work: (task) => {
        const info = task.context
        // primitives only: with DevTools attached, the console keeps logged objects alive (the whole region data)
        console.log(
          ...this.logTag,
          'Info loaded',
          'impostors',
          info?.impostors?.length ?? 0,
          'poi',
          info?.poiImpostors?.length ?? 0,
        )

        this.regionInfo = info
        this.terrain.component(TerrainRegionComponent).materialData = info.terrainMaterial
        this.createImpostorLayers(info)

        return true
      },
      finalize: (task, err) => {
        const isCancelled = err instanceof TaskCancelledError
        if (this.regionInfoTask === task) {
          this.regionInfoLoaded = !isCancelled
          this.regionInfoTask = null
        }

        this.loadCapitalData()
      },
    })
  }

  public loadCapitalData() {
    if (this.capitalData || this.capitalDataTask || this.capitalDataLoaded) {
      return
    }

    console.log(...this.logTag, `Loading capitals`)
    this.capitalDataTask = this.scheduler.schedule<RegionCapitals>({
      lane: PriorityLane.High,
      label: `Load capital data ${this.regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        const buffer = await this.contentService.fetchTypedRequest(
          getRegionCapitalsBinUrl(this.coatlicueName, this.regionName),
        )
        // parses capitals, chunks and the slice index, the slices are parsed on first use (SliceLibrary)
        task.context = decodeRegionCapitalsBin(buffer)
      },
      work: (task, budgetMs) => {
        if (!this.capitalSpawn) {
          const data = task.context
          this.capitalData = data
          // removed again on unload, together with the capital data
          this.contentService.slices.add(this, data.slices)
          this.capitalSpawn = { items: this.capitalSpawnItems(data), next: 0 }
          // primitives only: with DevTools attached, the console keeps logged objects alive (the whole capital data)
          console.log(
            ...this.logTag,
            'Capital data loaded',
            'slices',
            data.slices.size,
            'spawners',
            this.capitalSpawn.items.length,
          )
        }
        // the spawners are created over several frames, nearest first. finalize (capitalDataLoaded) runs after the last
        const deadline = performance.now() + Math.max(budgetMs, CAPITAL_SPAWN_BUDGET_MS)
        const spawn = this.capitalSpawn
        while (spawn.next < spawn.items.length) {
          const item = spawn.items[spawn.next++]
          if (item.chunk) {
            this.createChunk(item.layer, item.chunk)
          } else {
            this.createCapital(item.layer, item.capital)
          }
          if (performance.now() > deadline) {
            return false
          }
        }
        this.capitalSpawn = null
        return true
      },
      finalize: (task, err) => {
        const isCancelled = err instanceof TaskCancelledError
        if (this.capitalDataTask === task) {
          this.capitalDataLoaded = !isCancelled
          this.capitalDataTask = null
        }
      },
    })
  }
  // #endregion

  // #region createImpostor
  private createImpostorLayers(data: RegionInfo) {
    if (ENABLE_IMPOSTOR_VEG) {
      this.createImpostorLayer(data.impostors, false)
    }
    if (ENABLE_IMPOSTOR_POI) {
      this.createImpostorLayer(data.poiImpostors, true)
    }
  }

  private createImpostorLayer(impostor: RegionImpostor[], isPoi: boolean) {
    if (!impostor) {
      return
    }
    for (const item of impostor) {
      const entity = this.entity.world.createEntity(
        impostorEntityOptions(this.impostors, {
          name: item.model,
          model: item.model,
          origin: vec3(item.position.x, item.position.y, 0),
          regionSize: this.regionSize,
          cellSize: this.cellSize,
          isPoi,
        }),
      )
      const index = this.cellIndex(item.position.x, item.position.y)
      const impostor = entity.component(RegionImpostorComponent)
      if (isPoi) {
        this.poiImpostor[index] = impostor
      } else {
        this.impostor[index] = impostor
      }
    }
  }

  private cellIndex(x: number, y: number) {
    const count = Math.round(this.regionSize / this.cellSize)
    const ix = Math.floor((x - this.min.x) / this.cellSize)
    const iy = Math.floor((y - this.min.y) / this.cellSize)
    return ix + iy * count
  }
  // #endregion

  // #region createCapitals
  /**
   * The capitals and chunks of the region in one list, nearest to the camera first
   */
  private capitalSpawnItems(data: RegionCapitals): CapitalSpawnItem[] {
    const items: CapitalSpawnItem[] = []
    if (ENABLE_CAPITALS && data.capitals) {
      for (const layer in data.capitals) {
        for (const capital of data.capitals[layer]) {
          items.push({ layer, capital, chunk: null, distance: 0 })
        }
      }
    }
    if (ENABLE_CHUNKS && data.chunks) {
      for (const layer in data.chunks) {
        for (const chunk of data.chunks[layer]) {
          items.push({ layer, capital: null, chunk, distance: 0 })
        }
      }
    }
    const camera = this.entity.world.getSystem(EcsGame).scene.getView(0).camera.world
    for (const item of items) {
      const transform = (item.capital ?? item.chunk).transform
      const dx = transform[12] - camera[12]
      const dy = transform[13] - camera[13]
      item.distance = dx * dx + dy * dy
    }
    return items.sort(byDistance)
  }

  private createCapital(layer: string, item: CapitalRuntimeData) {
    const parent = this.getCapitalLayerEntity(layer)
    const options = capitalSliceEntityOptions(parent, item)
    const entity = this.entity.world.createEntity(options)
    const spawner = entity.component(SliceSpawnerComponent)
    this.slices.push(spawner)
    // cells with impostor meshes of the capital spawn it when they start loading
    const cells = new Set<RegionImpostorComponent>()
    this.collectImpostorCells(item.slice, mat4CreateFromArray(item.transform), cells, 0)
    for (const cell of cells) {
      cell.slices.push(spawner)
      spawner.heldBy.push(cell)
    }
  }

  /**
   * Collects the POI cells of the impostor meshes of a slice and its nested slices
   *
   * @param world - world transform of the slice spawner
   */
  private collectImpostorCells(ref: AssetReference, world: Mat4, cells: Set<RegionImpostorComponent>, depth: number) {
    const slice = this.contentService.slices.get(assetReferenceKey(ref))
    if (!slice?.entities || depth > 8) {
      return
    }
    // see SliceSpawnerComponent.spawn
    const parent = slice.transform ? mat4Multiply(world, mat4Invert(mat4CreateFromArray(slice.transform))) : world
    for (const entity of slice.entities) {
      let entityWorld: Mat4 = null
      for (const comp of entity.components) {
        if (isViewerMeshComponent(comp) && this.isImpostorMesh(comp)) {
          entityWorld ??= mat4Multiply(parent, mat4CreateFromArray(entity.transform))
          const cell = this.poiImpostorAt(entityWorld[12], entityWorld[13])
          if (cell) {
            cells.add(cell)
          }
        } else if (isViewerPrefabSpawnerComponent(comp) || isViewerPointSpawnerComponent(comp)) {
          entityWorld ??= mat4Multiply(parent, mat4CreateFromArray(entity.transform))
          this.collectImpostorCells(comp.slice, entityWorld, cells, depth + 1)
        }
      }
    }
  }
  // #endregion

  // #region createChunks
  private createChunk(layer: string, item: ChunkRuntimeData) {
    const parent = this.getCapitalLayerEntity(layer)
    // chunks that fit into one impostor cell are spawned by that cell.
    // Collision chunks are spawned by the SliceSystem, only while collision is shown.
    const isCollision = item.chunkType === ChunkType.Collision
    const cell =
      this.enableChunks && !isCollision && item.size <= this.cellSize
        ? this.poiImpostorAt(item.transform[12], item.transform[13])
        : null
    const options = chunkSliceEntityOptions(parent, item, cell)
    const entity = this.entity.world.createEntity(options)
    const spawner = entity.component(SliceSpawnerComponent)
    this.slices.push(spawner)
    if (cell) {
      cell.slices.push(spawner)
      spawner.heldBy.push(cell)
    }
  }
  // #endregion

  private getCapitalLayerEntity(layer: string) {
    console.assert(!!layer, 'Layer name is required')

    let entity = this.capitalLayers[layer]
    if (!entity) {
      entity = this.entity.world.createEntity({
        name: layer,
        parent: this.capitals,
        transform: new TransformComponent(),
      })
      this.capitalLayers[layer] = entity
    }
    return entity
  }
}
