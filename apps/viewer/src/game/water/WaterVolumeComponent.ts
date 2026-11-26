import {
  BoundsComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TaskCancelledError,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { Device, type Material, Mesh, type ResourceScope } from '@gglib/graphics'
import { mat4Identity } from '@gglib/math'
import { Model } from '@gglib/model'
import type { ViewerWaterVolumeComponent } from '../../api'
import { ContentService } from '../../content'
import { materialAssetPath } from '../../content'
import { buildWaterVolumeMesh } from './WaterVolumeMesh'

export type WaterVolumeState = 'idle' | 'loading' | 'built' | 'failed'

/**
 * Water volume of the Water gem (pools, ponds). Loads the material when activated and builds the flat
 * water surface on top of the entity shape.
 */
export class WaterVolumeComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerWaterVolumeComponent
  public state: WaterVolumeState = 'idle'

  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private scheduler: SchedulerSystem
  private task: ScheduledTask
  private model: Model
  private child: GameEntity

  public constructor(data: ViewerWaterVolumeComponent) {
    this.data = data
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public activate(): void {
    if (this.state !== 'idle') {
      return
    }
    this.state = 'loading'
    this.task = this.scheduler.schedule<Material>({
      entity: this.entity,
      lane: PriorityLane.Low,
      context: null,
      load: async (task) => {
        task.context = (await this.content.loadMaterialAsset(
          materialAssetPath(this.data.material),
          this.scope,
        )) as Material
      },
      finalize: (task, err) => {
        if (this.task === task) {
          this.task = null
        }
        if (err instanceof TaskCancelledError) {
          this.state = 'idle'
        } else if (err || !task.context) {
          console.warn('water volume material failed', this.data.material, err)
          this.state = 'failed'
        } else {
          this.build(task.context)
        }
      },
    })
  }

  public deactivate(): void {
    if (this.task) {
      this.scheduler.cancel(this.task)
    }
  }

  public destroy(): void {
    this.deactivate()
    this.child?.destroy()
    this.child = null
    this.model?.dispose()
    this.model = null
  }

  private build(material: Material) {
    const data = this.data
    const builder = buildWaterVolumeMesh(data.shape, this.entity.getTransform().world, {
      uScale: data.surfaceUScale || 1,
      vScale: data.surfaceVScale || 1,
      fogColor: data.fogColor ?? [0, 0, 0],
      fogDensity: data.fogDensity ?? 0,
      fogAffectedBySun: data.fogColorAffectedBySun,
    })
    if (!builder) {
      this.state = 'failed'
      return
    }
    const device = this.entity.service(Device)
    const geometry = builder.buildGeometry(device, { name: 'WaterVolume' })
    const mesh = new Mesh(device, {
      name: this.entity.name,
      geometries: [geometry],
      materials: [material],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    this.model = new Model(device, {
      name: this.entity.name,
      meshes: [mesh],
      nodes: [{ name: this.entity.name, mesh: 0, matrix: Array.from(mat4Identity()) }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    })
    // the geometry is in world space
    this.child = this.entity.world.createEntity({
      parent: this.entity,
      name: 'WaterVolumeMesh',
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4Identity(),
      }),
      components: [new BoundsComponent(), new SpatialNodeComponent(), new ModelComponent({ model: this.model })],
    })
    this.child.layer = this.entity.layer
    this.state = 'built'
  }
}
