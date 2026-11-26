import { MeshComponent, PriorityLane, SchedulerSystem, TaskCancelledError, type ScheduledTask } from '@gglib/components'
import { type GameComponent, type GameEntity } from '@gglib/ecs'
import { Device, type ResourceScope } from '@gglib/graphics'
import { type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { lfmt } from '@gglib/utils'
import { getRegionVegetationDataUrl, getRegionVegetationUrl, type RegionVegetationData } from '../../api'
import { VEGETATION_SLOT_COUNT } from '../../constants'
import { ContentService } from '../../content'
import { parseVegetation, type VegetationCell, type VegetationFile } from './parseVegetation'
import { VegetationBatch, type VegetationGroup } from './VegetationBatch'

export interface VegetationComponentOptions {
  coatlicueName: string
  regionName: string
  regionSize: number
  mountainHeight: number
  origin: IVec3
}

/**
 * Loads the region.vegetation file of a region and renders the cells around the camera with a {@link VegetationBatch}.
 * Cells and models are requested by the VegetationSystem.
 */
export class VegetationComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly options: VegetationComponentOptions

  public data: RegionVegetationData | null = null
  public file: VegetationFile | null = null
  public batch: VegetationBatch | null = null
  public isLoaded = false

  private scheduler: SchedulerSystem
  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private task: ScheduledTask | null = null
  private groupTasks = new Map<VegetationGroup, ScheduledTask>()
  private logTag = lfmt.badge('#8CD17D', 'Vegetation')

  public constructor(options: VegetationComponentOptions) {
    this.options = options
    this.logTag = lfmt.merge(this.logTag, lfmt.badge('#BAB0AC', options.regionName))
  }

  public initialize(): void {
    this.scheduler = this.entity.service(SchedulerSystem)
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
  }

  public activate(): void {
    // loading is requested by the VegetationSystem, once the camera is close to the region
  }

  public get isLoadRequested() {
    // a failed load (e.g. missing file) is loaded without data, it must not be requested again
    return !!(this.data || this.task || this.isLoaded)
  }

  /**
   * Loads the region.vegetation file (whole file, 20-170 MB for populated regions)
   */
  public load(): void {
    if (this.data || this.task || this.isLoaded) {
      return
    }
    const { coatlicueName, regionName } = this.options
    this.task = this.scheduler.schedule<[RegionVegetationData, ArrayBuffer]>({
      lane: PriorityLane.Low,
      label: `Load vegetation ${regionName}`,
      entity: this.entity,
      context: null,
      load: async (task) => {
        task.context = await Promise.all([
          this.content.fetchTypedRequest(getRegionVegetationUrl(coatlicueName, regionName)),
          this.content.fetchTypedRequest(getRegionVegetationDataUrl(coatlicueName, regionName)),
        ])
      },
      work: (task) => {
        const [data, buffer] = task.context
        this.data = data
        const t1 = performance.now()
        this.file = parseVegetation(buffer)
        const ms = performance.now() - t1
        console.log(...this.logTag, 'parseVegetation', ms, 'ms')
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
  }

  public destroy(): void {
    this.deactivate()
    for (const task of this.groupTasks.values()) {
      task.cancelled = true
    }
    this.groupTasks.clear()
    this.batch?.dispose()
    this.batch = null
  }

  /**
   * Creates the batch once the data is available
   */
  public ensureBatch(): VegetationBatch | null {
    if (this.batch || !this.file?.count || !this.data) {
      return this.batch
    }
    const { origin, mountainHeight, regionName } = this.options
    this.batch = new VegetationBatch(
      this.entity.service(Device),
      this.file,
      this.data,
      { originX: origin.x, originY: origin.y, mountainHeight },
      VEGETATION_SLOT_COUNT,
      `vegetation ${regionName}`,
    )
    this.batch.onMeshChanged = (mesh) => {
      this.entity.component(MeshComponent).mesh = mesh
    }
    console.log(...this.logTag, 'ready', {
      instances: this.file.count,
      cells: this.file.cells.length,
      assets: this.data.assets.length,
    })
    return this.batch
  }

  /**
   * Loads the models of all groups in the given cell
   */
  public requestCellModels(cell: VegetationCell) {
    if (!this.batch) {
      return
    }
    for (const it of cell.groups) {
      this.requestGroup(this.batch.groups[it.asset])
    }
  }

  private requestGroup(group: VegetationGroup) {
    if (!group || group.state !== 'idle') {
      return
    }
    group.state = 'loading'
    const batch = this.batch
    const task = this.scheduler.schedule<Model | null>({
      lane: PriorityLane.Low,
      label: `Load vegetation model ${group.model}`,
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
        }
      },
    })
    this.groupTasks.set(group, task)
  }
}
