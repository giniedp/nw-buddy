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
import type { ViewerRoadComponent } from '../../api'
import { ContentService, materialAssetPath } from '../../content'
import { buildRiverMesh, buildRoadMesh } from './RoadMesh'
import { RoadSystem } from './RoadSystem'

export type RoadState = 'idle' | 'loading' | 'waiting' | 'built' | 'failed'

/**
 * Road or river of the RoadsAndRivers gem. Loads the material when activated and builds a terrain conforming
 * strip along the entity spline once the terrain heights are available (see RoadSystem).
 */
export class RoadComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerRoadComponent
  public state: RoadState = 'idle'

  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private scheduler: SchedulerSystem
  private system: RoadSystem
  private task: ScheduledTask
  private material: Material
  private model: Model
  private child: GameEntity

  public constructor(data: ViewerRoadComponent) {
    this.data = data
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
    this.scheduler = this.entity.service(SchedulerSystem)
    this.system = this.entity.world.getSystem(RoadSystem)
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
          console.warn('road material failed', this.data.material, err)
          this.state = 'failed'
        } else {
          this.material = task.context
          this.state = 'waiting'
          this.system.requestBuild(this)
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
    this.system?.cancelBuild(this)
    this.child?.destroy()
    this.child = null
    this.model?.dispose()
    this.model = null
  }

  /**
   * Rivers are flat water surfaces, roads conform to the terrain and need its heights
   */
  public get isRiver() {
    return this.data.type === 'River'
  }

  /**
   * Builds the mesh, called by RoadSystem once the terrain under the road is loaded (right away for rivers)
   */
  public build(heightAt: (x: number, y: number) => number | undefined) {
    const world = this.entity.getTransform().world
    const builder = this.isRiver ? buildRiver(this.data, world) : buildRoadMesh(this.data, world, heightAt)
    if (!builder) {
      this.state = 'failed'
      return
    }
    const device = this.entity.service(Device)
    const geometry = builder.buildGeometry(device, { name: 'Road' })
    const mesh = new Mesh(device, {
      name: this.entity.name,
      geometries: [geometry],
      materials: [this.material],
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
      name: 'RoadMesh',
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

function buildRiver(data: ViewerRoadComponent, transform: ArrayLike<number>) {
  const river = data.river
  const scale = river?.fogColorScale ?? 1
  const color = river?.fogColor ?? [0, 0, 0, 1]
  return buildRiverMesh(data, transform, {
    tileWidth: river?.tileWidth || 1,
    fogColor: [color[0] * scale, color[1] * scale, color[2] * scale],
    fogDensity: river?.waterFogDensity ?? 0,
    lengthStartFade: river?.lengthStartFadeDist,
    lengthEndFade: river?.lengthEndFadeDist,
    widthFade: river?.widthFadeDist,
  })
}
