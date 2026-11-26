import {
  BoundsComponent,
  InstanceDataComponent,
  LifeCycleFlags,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TaskPhase,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import { GameEntity, type CreateEntityOptions, type GameComponent } from '@gglib/ecs'

import { Color, type ResourceScope } from '@gglib/graphics'
import { mat4CreateTranslation, vec3AddScalars, vec4$initFrom, type IVec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { ContentService } from '../../content'
import { setInstanceDissolveAmount } from '../../material'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { MeshLoaderComponent, MeshLoadState } from '../slice/MeshLoaderComponent'
import type { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { IMPOSTOR_HOLD } from '../../constants'

export interface ImpostorComponentOptions {
  name: string
  regionSize: number
  cellSize: number
  origin: IVec3
  model: string
  isPoi: boolean
}

export function impostorEntityOptions(parent: GameEntity, options: ImpostorComponentOptions): CreateEntityOptions {
  return {
    parent: parent,
    name: options.name,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateTranslation(options.origin),
      lifeCycle: LifeCycleFlags.PropagateOnly, // is controlled by RegionSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-box',
        layer: options.isPoi ? DebugLayer.Impostor_POI : DebugLayer.Impostor_VEG,
        color: options.isPoi ? Color.Orange : Color.Lime,
      }),
      new SpatialNodeComponent(),
      new BoundsComponent(),
      new ModelComponent(),
      new InstanceDataComponent(),
      new RegionImpostorComponent(options),
    ],
  }
}

/**
 * - far: chunk content is inactive, the impostor is shown
 * - loading: chunks are spawned and their meshes are activated, the impostor is shown
 * - ready: all members are active and loaded, the impostor may hide
 */
export type ImpostorContentState = 'far' | 'loading' | 'ready'

export interface ImpostorContentMember {
  entity: GameEntity
  loaders: MeshLoaderComponent[]
}

export class RegionImpostorComponent implements GameComponent {
  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private scheduler: SchedulerSystem

  public readonly entity: GameEntity
  public readonly min: IVec3
  public readonly max: IVec3
  public readonly isPoi: boolean

  /**
   * Visible by camera, updated by region system
   */
  public isVisible: boolean
  /**
   * Squared distance to camera, updated by region system
   */
  public distanceSquared: number
  /**
   * Whether model has been loaded
   */
  public get isModelLoaded() {
    return !!this.model
  }

  private modelUrl: string
  private meshLoadTask: ScheduledTask
  private model: Model
  private instance: InstanceDataComponent

  /**
   * Slices spawned by this cell when it starts loading, with all their nested slices:
   * - chunks inside the cell, the SliceSystem does not spawn them (POI cells in chunk worlds only)
   * - capitals with impostor meshes inside the cell, the SliceSystem may spawn them earlier by distance
   */
  public readonly slices: SliceSpawnerComponent[] = []
  /**
   * Mesh entities that are baked into the impostor, activated by the cell instead of the range system.
   * The cell waits for them before it is ready. See SliceSpawnerComponent.spawn for the selection.
   */
  public readonly members: ImpostorContentMember[] = []
  public contentState: ImpostorContentState = 'far'
  /**
   * Number of members activated since the cell started loading
   */
  public activated = 0

  /**
   * Whether the cell has content that replaces the impostor up close, owned slices or members
   */
  public get hasContent() {
    return this.slices.length > 0 || this.members.length > 0
  }

  public constructor(data: ImpostorComponentOptions) {
    this.isPoi = !!data.isPoi
    const half = data.cellSize * 0.5
    this.min = vec3AddScalars(data.origin, -half, -half, 0)
    this.max = vec3AddScalars(data.origin, half, half, data.regionSize)
    this.modelUrl = data.model
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
    this.scheduler = this.entity.service(SchedulerSystem)
    this.instance = this.entity.component(InstanceDataComponent)
    this.updateDissolve()
  }

  public activate(): void {
    // the model is requested by the RegionSystem with updateLoad(), once the cell is in view
  }

  public deactivate(): void {
    // finalize clears the task
    this.scheduler.cancel(this.meshLoadTask)
  }

  public destroy(): void {
    this.scheduler.cancel(this.meshLoadTask)
  }

  public setContentState(state: ImpostorContentState) {
    this.contentState = state
    this.updateDissolve()

    const shape = this.entity.$(DebugShapeComponent).entries[0]
    switch (state) {
      case 'loading': {
        vec4$initFrom(shape.color, Color.Red)
        break
      }
      case 'ready': {
        vec4$initFrom(shape.color, Color.DeepSkyBlue)
        break
      }
      default: {
        vec4$initFrom(shape.color, Color.Orange)
        break
      }
    }
  }

  private updateDissolve() {
    let dissolveAmount = IMPOSTOR_HOLD ? 0 : 1
    if (!this.isPoi || this.contentState === 'ready') {
      // cell content is loaded, impostor near playe can dissolve now
      // vegetation cells currently always dissolve
      dissolveAmount = 1
    }
    setInstanceDissolveAmount(this.instance.data, dissolveAmount)
  }

  public addMember(member: ImpostorContentMember) {
    for (const loader of member.loaders) {
      loader.lane = PriorityLane.High
      // ordered by the distance of the cell, not of the mesh pivot
      loader.priorityEntity = this.entity
    }
    this.members.push(member)
    if (this.contentState === 'ready') {
      // spawned after the cell finished loading, e.g. a nested slice of a capital spawned by distance.
      // The cell loads again and holds the impostor until the new member is loaded.
      this.setContentState('loading')
    }
  }

  public removeMembers(parent: GameEntity) {
    for (let i = this.members.length - 1; i >= 0; i--) {
      if (this.members[i].entity.parent === parent) {
        this.members.splice(i, 1)
      }
    }
    this.activated = Math.min(this.activated, this.members.length)
  }

  /**
   * Number of members whose meshes are not loaded yet
   */
  public countPending() {
    let result = 0
    for (const member of this.members) {
      if (!isMemberDone(member)) {
        result++
      }
    }
    return result
  }

  public deactivateMembers() {
    for (const member of this.members) {
      if (member.entity.canDeactivate) {
        member.entity.deactivate()
      }
    }
    this.activated = 0
  }

  public loadMesh(): void {
    if (this.model) {
      // already loaded
      return
    }

    if (!this.isVisible) {
      // went out of view before started loading
      if (this.meshLoadTask?.phase === TaskPhase.Idle) {
        this.scheduler.cancel(this.meshLoadTask)
      }
      return
    }

    if (this.meshLoadTask) {
      // already in flight
      return
    }

    this.meshLoadTask = this.scheduler.schedule<Model>({
      lane: PriorityLane.Critical,
      entity: this.entity,
      label: this.modelUrl,
      context: null,
      load: async (task) => {
        task.context = await this.content.loadModel(this.modelUrl, null, this.scope)
      },
      work: (task) => {
        this.model = task.context
        this.entity.component(ModelComponent).model = this.model
        return true
      },
      finalize: (task, err) => {
        if (this.meshLoadTask === task) {
          this.meshLoadTask = null
        }
      },
    })
  }
}

function isMemberDone(member: ImpostorContentMember) {
  for (const loader of member.loaders) {
    if (loader.state !== MeshLoadState.loaded && loader.state !== MeshLoadState.failed) {
      return false
    }
  }
  return true
}
