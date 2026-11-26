import { MeshComponent, PriorityLane, SchedulerSystem, TaskCancelledError, type ScheduledTask } from '@gglib/components'
import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { Device, type ResourceScope } from '@gglib/graphics'
import { type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { lfmt } from '@gglib/utils'
import { getRegionDistributionDataUrl, getRegionDistributionUrl, type RegionDistributionData } from '../../api'
import { ContentService } from '../../content'
import { TerrainRegionComponent } from '../terrain/TerrainRegionComponent'
import { DistributionBatch, type DistributionGroup } from './DistributionBatch'
import { parseDistribution, type DistributionCell, type DistributionData } from './parseDistribution'

export interface DistributionComponentOptions {
  coatlicueName: string
  regionName: string
  regionSize: number
  cellSize: number
  mountainHeight: number
  origin: IVec3
  /**
   * Provides the heightmap to place the instances on the terrain
   */
  terrain: TerrainRegionComponent
}

/**
 * Loads the distribution of a region and renders it with a {@link DistributionBatch}.
 * Models are loaded on demand, when the DistributionSystem requests the cells around the camera.
 */
export class DistributionComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly options: DistributionComponentOptions

  public data: DistributionData | null = null
  public batch: DistributionBatch | null = null
  public isLoaded: boolean

  private scheduler: SchedulerSystem
  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private task: ScheduledTask | null = null
  private groupTasks = new Map<DistributionGroup, ScheduledTask>()
  private requestedCells = new Set<DistributionCell>()
  private logTag = lfmt.badge('#59A14F', 'Distribution')

  public get cells() {
    return this.data?.cells || []
  }

  public constructor(options: DistributionComponentOptions) {
    this.options = options
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', options.regionName))
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
  }

  public activate(): void {
    if (this.data || this.task) {
      return
    }
    const { coatlicueName, regionName } = this.options
    this.task = this.scheduler.schedule<[RegionDistributionData, ArrayBuffer]>({
      lane: PriorityLane.Medium,
      label: `Load distribution ${regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await Promise.all([
          this.content.fetchTypedRequest(getRegionDistributionUrl(coatlicueName, regionName)),
          this.content.fetchTypedRequest(getRegionDistributionDataUrl(coatlicueName, regionName)),
        ])
      },
      work: (task) => {
        const [header, buffer] = task.context
        const cellsPerAxis = this.options.regionSize / this.options.cellSize
        const now = performance.now()
        this.data = parseDistribution(header, buffer, cellsPerAxis)
        const t = performance.now() - now
        console.log(...this.logTag, 'parseDistribution', t, 'ms')
        return true
      },
      finalize: (task, err) => {
        const isCancelled = err instanceof TaskCancelledError

        if (this.task === task) {
          this.task = null
          this.isLoaded = !isCancelled
        }

        if (err && !isCancelled) {
          console.warn(...this.logTag, 'not loaded', err)
        }
      },
    })
  }

  public deactivate(): void {
    if (this.task) {
      this.task.cancelled = true
      this.task = null
    }
    // pending model loads are not needed while the region is inactive.
    // finalize resets the groups to idle and forgets their cells, so they are requested again
    for (const task of [...this.groupTasks.values()]) {
      this.scheduler.cancel(task)
    }
  }

  public destroy(): void {
    this.deactivate()
    this.batch?.dispose()
    this.batch = null
  }

  /**
   * Creates the batch once the data and the heightmap are available
   */
  public ensureBatch(): DistributionBatch | null {
    if (this.batch || !this.data?.header.count || !this.options.terrain.heightmap) {
      return this.batch
    }
    const { origin, regionSize, cellSize, mountainHeight, terrain } = this.options
    this.batch = new DistributionBatch(this.entity.service(Device), this.data, {
      originX: origin.x,
      originY: origin.y,
      regionSize,
      cellSize,
      mountainHeight,
      heightmap: terrain.heightmap,
    })
    this.batch.onMeshChanged = (mesh) => {
      this.entity.component(MeshComponent).mesh = mesh
    }
    console.log(...this.logTag, 'ready', {
      instances: this.data.header.count,
      types: this.data.header.types.length,
      groups: this.batch.groups.length,
      records: this.batch.recordCount,
    })
    return this.batch
  }

  /**
   * Loads the models of all groups in the given cell
   */
  public requestCell(cell: DistributionCell) {
    if (!this.batch || this.requestedCells.has(cell)) {
      return
    }
    this.requestedCells.add(cell)
    for (const group of this.batch.cellGroups(cell)) {
      this.requestGroup(group)
    }
  }

  private requestGroup(group: DistributionGroup) {
    if (group.state !== 'idle') {
      return
    }
    group.state = 'loading'
    const batch = this.batch
    const task = this.scheduler.schedule<Model | null>({
      lane: PriorityLane.Low,
      label: `Load distribution model ${group.model}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context =
          (await this.content.loadModel(group.model, group.material, this.scope)?.catch(() => null)) ?? null
      },
      work: (task) => {
        batch.enableGroup(group, task.context)
        return true
      },
      finalize: (_, err) => {
        this.groupTasks.delete(group)
        if (err) {
          // retry on next request
          group.state = 'idle'
          for (const cell of this.requestedCells) {
            if (batch.cellGroups(cell).includes(group)) {
              this.requestedCells.delete(cell)
            }
          }
        }
      },
    })
    this.groupTasks.set(group, task)
  }
}
