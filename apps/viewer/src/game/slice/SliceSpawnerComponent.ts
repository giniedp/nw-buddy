import { BoundsComponent, LifeCycleFlags, TransformComponent } from '@gglib/components'
import { type ActivatableComponent, type CreateEntityOptions, type GameComponent, type GameEntity } from '@gglib/ecs'
import { BoundingBox, BoundingSphere, mat4CreateFromArray } from '@gglib/math'
import {
  ChunkType,
  type AssetReference,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type ViewerSlice,
} from '../../api'
import type { ObjectDetailTier } from '../../constants'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { RangeActivationSystem } from './RangeActivationSystem'
import type { SpawnRuleSource } from './spawnRules'

/**
 * Finds the POI impostor cell at a world position
 */
export type ImpostorCellLookup = (x: number, y: number) => RegionImpostorComponent | null

export interface SliceSpawnerComponentOptions {
  isChunk?: boolean
  /**
   * The slice is a collision chunk, spawned only while collision is shown
   */
  isCollision?: boolean
  /**
   * Size of the chunk, if this is a chunk slice
   */
  chunkSize?: number
  /**
   * The chunk entry, if this is a chunk slice: decides its reach (see gdeReach.chunkReach)
   */
  chunk?: Pick<ChunkRuntimeData, 'size' | 'chunkType' | 'spawnRadius'>
  /**
   * Physical radius of the capital record, if this is a capital slice (see gdeReach.capitalReach)
   */
  capitalRadius?: number
  /**
   * Top level spawner of a region (capital or chunk): spawned by the GDE reach rules and despawned beyond them.
   * Nested prefab spawners spawn with their parent slice, other nested and preview spawners use the AOI spawn radius
   * of their slice.
   */
  isTopLevel?: boolean
  /**
   * Impostor cell that spawns this chunk
   */
  cell?: RegionImpostorComponent | null
  /**
   * The spawner component of a nested slice, for the spawn rules (spawnRules.ts). None for capitals and chunks.
   */
  source?: SpawnRuleSource | null
  /**
   * The slice that holds the spawner component of a nested slice, for the spawn rules. None for capitals and chunks.
   */
  parent?: ViewerSlice | null
  /**
   * A nested prefab spawner: it spawns with its parent slice, as the game's initializer spawns, instead of at its AOI
   * spawn radius
   */
  spawnsWithParent?: boolean

  slice: AssetReference
}

export function capitalSliceEntityOptions(parent: GameEntity, data: CapitalRuntimeData): CreateEntityOptions {
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by SliceSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-sphere',
        color: { x: 1, y: 0, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new BoundsComponent({
        sphere: BoundingSphere.create(0, 0, 0, data.radius),
      }),
      new SliceSpawnerComponent({
        slice: data.slice,
        capitalRadius: data.radius,
        isTopLevel: true,
      }),
    ],
  }
}

export function chunkSliceEntityOptions(
  parent: GameEntity,
  data: ChunkRuntimeData,
  cell: RegionImpostorComponent | null,
): CreateEntityOptions {
  const half = data.size * 0.5
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by SliceSystem
    }),
    components: [
      new BoundsComponent({
        // chunk position is the cell center
        box: BoundingBox.create(-half, -half, -half, half, half, half),
      }),
      new DebugShapeComponent({
        type: 'bounds-box',
        color: { x: 1, y: 1, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new SliceSpawnerComponent({
        isChunk: true,
        isCollision: data.chunkType === ChunkType.Collision,
        chunkSize: data.size,
        chunk: data,
        isTopLevel: true,
        cell,
        slice: data.slice,
      }),
    ],
  }
}

export class SliceSpawnerComponent implements GameComponent, ActivatableComponent {
  public entity: GameEntity
  public slice: AssetReference
  public bounds: BoundsComponent
  private rangeSystem: RangeActivationSystem
  public rangeEntities: GameEntity[] = []

  public data: ViewerSlice
  public spawnRadius: number
  public isLoaded: boolean
  public isSpawned: boolean
  public readonly isChunk: boolean
  public readonly isCollision: boolean
  public readonly chunkSize: number
  public readonly chunk: Pick<ChunkRuntimeData, 'size' | 'chunkType' | 'spawnRadius'> | null
  public readonly capitalRadius: number
  public readonly isTopLevel: boolean
  /**
   * The spawner component of a nested slice, null for capitals and chunks
   */
  public readonly source: SpawnRuleSource | null
  /**
   * The slice that holds the spawner component of a nested slice, null for capitals and chunks
   */
  public readonly parent: ViewerSlice | null
  /**
   * See {@link SliceSpawnerComponentOptions.spawnsWithParent}
   */
  public readonly spawnsWithParent: boolean
  /**
   * Reach across the ground (2D) within which the slice stands, by the GDE rules (see gdeReach), for the object detail
   * tier {@link reachTier}. 0 when the slice uses its AOI spawn radius instead ({@link spawnRadius}, 3D).
   */
  public reach = 0
  /**
   * Object detail tier the {@link reach} was computed for
   */
  public reachTier: ObjectDetailTier | null = null
  /**
   * Squared distance to the camera while queued for spawning or despawning by the SliceSystem
   */
  public queueDistance = 0

  /**
   * Impostor cell that spawns this chunk, the SliceSystem does not spawn it by distance
   */
  public readonly impostor: RegionImpostorComponent | null

  /**
   * Cells that activate mesh entities of this slice
   */
  public readonly memberCells = new Set<RegionImpostorComponent>()
  /**
   * POI cells that spawn this slice when they start loading (RegionImpostorComponent.slices). The SliceSystem doesn't
   * despawn it while one of them is not far.
   */
  public readonly heldBy: RegionImpostorComponent[] = []
  public readonly slices: SliceSpawnerComponent[] = []

  public constructor(data: SliceSpawnerComponentOptions) {
    this.slice = data.slice
    this.isChunk = !!data.isChunk
    this.isCollision = !!data.isCollision
    this.chunkSize = data.chunkSize ?? 0
    this.chunk = data.chunk ?? null
    this.capitalRadius = data.capitalRadius ?? 0
    this.isTopLevel = !!data.isTopLevel
    this.impostor = data.cell ?? null
    this.source = data.source ?? null
    this.parent = data.parent ?? null
    this.spawnsWithParent = !!data.spawnsWithParent
    this.spawnRadius = 0
  }

  public initialize(): void {
    this.bounds = this.entity.component(BoundsComponent)
    this.rangeSystem = this.entity.world.getSystem(RangeActivationSystem)
  }

  public activate(): void {
    //
  }

  public unload() {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    this.releaseSpawned()
  }

  /**
   * Whether a POI cell that spawns this slice is loading or ready, so it must stay
   */
  public get isHeld() {
    for (const cell of this.heldBy) {
      if (cell.contentState !== 'far') {
        return true
      }
    }
    return false
  }

  /**
   * Destroys the spawned entities (nested spawners despawn with them) and lets the slice spawn again later. The
   * loaded models stay cached in the scope of the region.
   */
  public despawn(): void {
    if (!this.isSpawned) {
      return
    }
    this.releaseSpawned()
    // each child detaches itself while being destroyed
    for (const child of Array.from(this.entity.getTransform().children)) {
      if (child.entity && !child.entity.isDestroyed) {
        child.entity.destroy()
      }
    }
    this.slices.length = 0
    this.isSpawned = false
  }

  private releaseSpawned() {
    for (const entity of this.rangeEntities) {
      this.rangeSystem.remove(entity)
    }
    this.rangeEntities.length = 0
    for (const cell of this.memberCells) {
      cell.removeMembers(this.entity)
    }
    this.memberCells.clear()
  }
}
