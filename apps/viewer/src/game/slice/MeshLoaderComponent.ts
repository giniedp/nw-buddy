import {
  BoundsComponent,
  InstanceDataComponent,
  ModelComponent,
  PriorityLane,
  SchedulerSystem,
  SpatialNodeComponent,
  TaskCancelledError,
  TransformComponent,
  type ScheduledTask,
} from '@gglib/components'
import type { GameComponent, GameEntity } from '@gglib/ecs'
import { Color, type ResourceScope } from '@gglib/graphics'
import {
  mat4CreateFromArray,
  mat4CreateFromRTS,
  mat4Identity,
  mat4Multiply,
  vec3Add,
  vec3Length,
  vec3MultiplyScalar,
  vec3Subtract,
  vec4,
  type Mat4,
} from '@gglib/math'
import { Model, ModelLod } from '@gglib/model'
import { brand, type Brand, type EventType } from '@gglib/utils'
import type { ViewerMeshComponent } from '../../api'
import { COMBINE_INSTANCE_ARRAYS, ENABLE_INSTANCED_LEVEL_OBJECTS } from '../../constants'
import { ContentService, type CgfLodInfo } from '../../content'
import type { CgfSkinBones } from '../../formats/cgf'
import { createInstanceData, MaterialLayerFlags } from '../../material/common'
import { ViewerConfig } from '../../config'
import { CulledModelComponent } from '../culling/CulledModelComponent'
import { CullingSystem } from '../culling/CullingSystem'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { InstancedModelComponent } from '../instancing/InstancedModelComponent'
import { InstancedRenderSystem } from '../instancing/InstancedRenderSystem'
import { addModelBounds, emptyBox, isBoxValid } from './meshBounds'
import { RangeActivationSystem } from './RangeActivationSystem'

export type MeshLoadState = Brand<number, 'MeshLoad'>
export const MeshLoadState = {
  idle: brand<MeshLoadState>(0),
  loading: brand<MeshLoadState>(1),
  loaded: brand<MeshLoadState>(2),
  failed: brand<MeshLoadState>(-1),
}

/**
 * A model of a {@link MeshLoaderComponent.skinned} loader: its per instance data takes the skin offset
 */
export interface SkinnedDraw {
  data: Float32Array<ArrayBuffer>
  /**
   * The bones the joint indices of the mesh's bone mapping refer to, null when the file has no bones
   */
  bones: CgfSkinBones | null
}

export class MeshLoaderComponent implements GameComponent {
  /**
   * Emitted when a model is successfully loaded
   */
  public static onLoad = brand<EventType<GameEntity>>(Symbol('MeshLoaderComponent.onLoad'))
  /**
   * Emitted when o model failed to load
   */
  public static onError = brand<EventType<GameEntity>>(Symbol('MeshLoaderComponent.onError'))

  public readonly entity: GameEntity
  public readonly data: ViewerMeshComponent

  /**
   * Layer flags of the model entities: decal receivers (acceptDecals) get {@link MaterialLayerFlags.DecalReceiver},
   * snow receivers (acceptSnow) {@link MaterialLayerFlags.SnowReceiver}
   */
  private get layerFlags() {
    const decal = this.data.acceptDecals ? MaterialLayerFlags.DecalReceiver : 0
    const snow = this.data.acceptSnow ? MaterialLayerFlags.SnowReceiver : 0
    return decal | snow
  }

  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private scheduler: SchedulerSystem

  private isLoaded: boolean = false
  private task: ScheduledTask

  /**
   * Load state of the model, failed loads are not retried until the next activation
   */
  public state: MeshLoadState = MeshLoadState.idle
  /**
   * Scheduler lane of the model load
   */
  public lane: PriorityLane = PriorityLane.Low
  /**
   * View distance of the mesh when it decides the activation range of its entity, 0 otherwise. Once loaded, the range
   * activation measures it from the world bounds of the model (the game measures to the world AABB, point_aabb_sq):
   * the bounding sphere center with the view distance plus the sphere radius. Before the first load it is measured from
   * the entity position, the bounds are not known.
   */
  public viewRange = 0
  /**
   * Entity whose distance to the camera orders the model load, the own entity if null. Members of a POI impostor cell
   * load in the order of their cell, so a cell completes as a unit.
   */
  public priorityEntity: GameEntity | null = null
  /**
   * The model is a character part, skinned by the CharacterComponent of the entity: it renders through the scene path
   * (no culling worker, no instance batch) with its own per instance data, listed in {@link skinnedDraws}
   */
  public skinned = false
  /**
   * The draws of the loaded models when {@link skinned}
   */
  public readonly skinnedDraws: SkinnedDraw[] = []

  /**
   * Whether the loaded model is drawn. Off, the model still loads and stays loaded, its entities are deactivated
   * (e.g. a character attachment the game hides by default).
   */
  public get visible() {
    return this.isVisible
  }
  public set visible(value: boolean) {
    if (this.isVisible === value) {
      return
    }
    this.isVisible = value
    for (const child of this.modelEntities) {
      setEntityActive(child, value)
    }
  }
  private isVisible = true
  /**
   * The entities of the loaded model, children of this entity
   */
  private readonly modelEntities: GameEntity[] = []

  /**
   * Public material params that replace the ones of the `.mtl` for this model (e.g. the blend mask colors of an
   * appearance row): the model gets its own material instances. Null shares the materials.
   */
  private readonly materialParams: Record<string, string | number> | null

  public constructor(data: ViewerMeshComponent, options?: { materialParams?: Record<string, string | number> | null }) {
    this.data = data
    this.materialParams = options?.materialParams ?? null
  }

  /**
   * Creates the model of this entity from a source model: shared meshes and materials, or own materials with the
   * {@link materialParams}
   */
  private instantiate = (source: Model): Model => {
    const params = this.materialParams
    if (!params) {
      return instantiateModel(source)
    }
    return source.instantiate({
      meshes: true,
      materials: (material) => {
        const properties = material.properties as { params?: Record<string, unknown> }
        return material.instantiate({ ...properties, params: { ...properties.params, ...params } })
      },
    })
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.scope = this.content.scopeOf(this.entity)
    this.scheduler = this.entity.service(SchedulerSystem)
  }

  public destroy(): void {
    this.cancelLoad()
  }

  public activate(): void {
    if (this.task || this.isLoaded) {
      return
    }

    this.state = MeshLoadState.loading
    this.task = this.scheduler.schedule<Model>({
      entity: this.priorityEntity ?? this.entity,
      lane: this.lane,
      context: null,
      load: async (task) => {
        task.context = await this.content.loadModel(this.data.mesh, this.data.material, this.scope)
      },
      work: (task) => {
        const culled = this.canCullInWorker(task.context)
        const createModelComponent = this.modelComponentFactory(task.context, culled)
        // culled models are not part of the spatial index, the culling worker culls and picks them
        const spatial = !this.data.alwaysRender && !culled
        const combineInstances = COMBINE_INSTANCE_ARRAYS && !task.context.skins?.length
        if (this.data.instances?.length > 0 && !combineInstances) {
          for (const inst of this.data.instances) {
            const model = this.instantiate(task.context)
            this.attachLod(
              model,
              task.context,
              this.instantiate,
              scaleZ(this.entity.getTransform().world) * scaleZ(inst),
            )

            const child = this.entity.world.createEntity({
              parent: this.entity,
              transform: new TransformComponent({
                local: mat4CreateFromArray(inst),
              }),
              components: [
                new BoundsComponent(),
                spatial ? new SpatialNodeComponent() : null,
                new DebugShapeComponent({
                  type: 'bounds-box',
                  color: Color.LimeGreen,
                  layer: DebugLayer.MeshInstance,
                }),
                ...createModelComponent(model),
              ].filter((it) => !!it),
            })
            // render layer of the owning entity (e.g. inactive entities)
            child.layer = this.entity.layer
            child.layerFlags = this.layerFlags
            this.addModelEntity(child)
          }
        } else {
          let instantiate = this.instantiate
          if (this.data.instances?.length > 0) {
            instantiate = (source: Model) => createInstanceArrayModel(source, this.data.instances)
          }
          const model = instantiate(task.context)
          // combined instance arrays select one level for all instances, the entity scale stands for all of them
          this.attachLod(model, task.context, instantiate, scaleZ(this.entity.getTransform().world))
          const color = { x: 0, y: 0, z: 1 }
          if (this.data.visibilityOccluder) {
            color.x = 1
          }
          if (this.data.alwaysRender) {
            color.x = 1
            color.y = 1
          }

          const boxTransforms: Mat4[] = []
          // console.log('scene', model.sceneNodes)
          for (const node of model.sceneNodes) {
            const mesh = model.meshes[node.data?.mesh]
            if (!mesh) {
              continue
            }
            const box = mesh.boundingBox
            const boxScale = vec3Subtract(box.max, box.min)
            const boxCenter = vec3MultiplyScalar(vec3Add(box.min, box.max), 0.5)
            const boxTransform = mat4CreateFromRTS(vec4(0, 0, 0, 1), boxCenter, boxScale)
            boxTransforms.push(mat4Multiply(node.world, boxTransform))
          }

          const child = this.entity.world.createEntity({
            parent: this.entity,
            transform: new TransformComponent({
              local: mat4Identity(),
            }),
            components: [
              new BoundsComponent(),
              spatial ? new SpatialNodeComponent() : null,
              new DebugShapeComponent({
                type: 'box',
                color: color,
                layer: DebugLayer.Mesh,
                instances: boxTransforms,
              }),
              ...createModelComponent(model),
            ].filter((it) => !!it),
          })
          // render layer of the owning entity (e.g. inactive entities)
          child.layer = this.entity.layer
          child.layerFlags = this.layerFlags
          this.addModelEntity(child)
        }
        this.moveRangeToBounds(task.context)
        return true
      },
      finalize: (task, err) => {
        if (this.task === task) {
          this.task = null
        }

        if (!err) {
          this.state = MeshLoadState.loaded
          this.isLoaded = true
          this.entity.events.emit(MeshLoaderComponent.onLoad, this.entity)
        } else if (err instanceof TaskCancelledError) {
          this.state = MeshLoadState.idle
          //
        } else {
          this.state = MeshLoadState.failed
          this.entity.events.emit(MeshLoaderComponent.onError, this.entity)
        }
      },
    })
  }

  /**
   * Tracks an entity of the loaded model for {@link visible}, deactivated right away while invisible
   */
  private addModelEntity(child: GameEntity) {
    this.modelEntities.push(child)
    if (!this.isVisible) {
      setEntityActive(child, false)
    }
  }

  /**
   * Measures the activation range from the world bounds of the loaded model (see {@link viewRange})
   */
  private moveRangeToBounds(model: Model) {
    if (!(this.viewRange > 0)) {
      return
    }
    const world = this.entity.getTransform().world
    const box = emptyBox()
    if (this.data.instances?.length) {
      for (const inst of this.data.instances) {
        addModelBounds(model, mat4Multiply(world, mat4CreateFromArray(inst)), box)
      }
    } else {
      addModelBounds(model, world, box)
    }
    if (!isBoxValid(box)) {
      return
    }
    const center = vec3MultiplyScalar(vec3Add(box.min, box.max), 0.5)
    const radius = vec3Length(vec3Subtract(box.max, box.min)) * 0.5
    this.entity.world
      .getSystem(RangeActivationSystem, { optional: true })
      ?.move(this.entity, center, this.viewRange + radius)
  }

  /**
   * Out of range, a pending load is no longer needed. It is scheduled again on the next activation.
   */
  public deactivate(): void {
    this.cancelLoad()
  }

  private cancelLoad() {
    if (this.task) {
      // finalize resets the state to 'idle' and clears the task
      this.scheduler.cancel(this.task)
    }
  }

  /**
   * Assigns the levels of detail of a source model to an instance of it
   *
   * Like the engine (CObjManager::GetObjectLOD with e_LodFaceArea): level 1 begins at the distance of the CGF
   * (sqrt(face area) / e_LodFaceAreaTargetSize), divided by lodRatio / 100 and multiplied by the world z scale, and every
   * further level at twice the distance of the previous one. New World leaves e_UseScreenPctLOD off, so
   * Lod_MinScreenPct is not used.
   *
   * @param instance - the model of this entity
   * @param source - the shared model it was created from
   * @param instantiate - creates the model of a level the same way as the instance was created from the source
   * @param scale - length of the z axis of the world transform, the engine scales the distances by it
   */
  private attachLod(instance: Model, source: Model, instantiate: (level: Model) => Model, scale: number) {
    const info = source.meta.lod as CgfLodInfo | null
    // like the engine (GetLodDistances), the distances are divided by lodRatio / 100, a ratio of 0 disables the levels
    const lodRatio = (this.data.lodRatio ?? 100) / 100
    if (!info || lodRatio <= 0) {
      return
    }
    instance.lod = new ModelLod(instance, {
      distance: (info.distance / lodRatio) * scale,
      spacing: 'doubling',
      maxLevel: info.maxLevel,
      load: async (level) => {
        const model = await this.content.loadModelLod(this.data.mesh, this.data.material, level, this.scope)
        return model ? instantiate(model) : null
      },
    })
  }

  /**
   * Whether the model is culled by the culling worker instead of the scene traversal, see {@link CullingSystem}
   */
  private canCullInWorker(model: Model): boolean {
    if (this.data.alwaysRender || this.skinned || model.skins?.length) {
      return false
    }
    return !!this.entity.world.getSystem(CullingSystem, { optional: true })?.canCull(model)
  }

  /**
   * Renders static models through the GPU instance batch, falls back to the scene render path otherwise
   */
  private modelComponentFactory(model: Model, culled: boolean): (instance: Model) => GameComponent[] {
    // the game uses MaxViewDistance as it stands, no multiplier
    const maxViewDistance = this.data.maxViewDistance || 0
    if (culled) {
      return (instance) => [
        new CulledModelComponent({
          model: instance,
          data: createInstanceData({ maxViewDistance }),
        }),
      ]
    }
    const instanceSystem = this.entity.world.getSystem(InstancedRenderSystem, { optional: true })
    let canInstance = ENABLE_INSTANCED_LEVEL_OBJECTS

    if (!instanceSystem || !instanceSystem.canRender(model)) {
      canInstance = false
    }
    if (this.data.alwaysRender || this.skinned) {
      canInstance = false
    }
    if (!this.data.instances?.length) {
      canInstance = false
    }

    if (!canInstance) {
      // shaders fade out by the relative distance to the max view distance (e.g. GeometryBeam %ENABLE_FADEOUT)
      const bones: CgfSkinBones | null = model.meta.skinBones ?? null
      return (instance) => {
        const data = createInstanceData({ maxViewDistance })
        if (this.skinned) {
          this.skinnedDraws.push({ data, bones })
        }
        return [
          new InstanceDataComponent({
            data,
          }),
          new ModelComponent({
            model: instance,
          }),
        ]
      }
    }

    const key = `${this.data.mesh}|${this.data.material || ''}`
    return (instance) => {
      return [
        new InstancedModelComponent({
          model: instance,
          key,
          maxViewDistance,
        }),
      ]
    }
  }
}

/**
 * Creates a model that shares the meshes and materials of the source model
 */
/**
 * Activates or deactivates an entity of a loaded model, skips an entity that is not in a state for it
 */
function setEntityActive(entity: GameEntity, active: boolean) {
  if (active && entity.canActivate) {
    entity.activate()
  } else if (!active && entity.canDeactivate) {
    entity.deactivate()
  }
}

function instantiateModel(source: Model): Model {
  return source.instantiate({ meshes: false, materials: false })
}

/**
 * Creates a model that contains the mesh nodes of the source model once per instance.
 * The meshes are shared with the source model, so all instances are rendered and culled as one model.
 */
function createInstanceArrayModel(source: Model, instances: ArrayLike<number>[]): Model {
  const base = source.instantiate({ meshes: false, materials: false })
  base.update(mat4Identity())
  const meshNodes = base.sceneNodes.filter((node) => source.meshes[node.data?.mesh])
  const nodes = []
  for (const instance of instances) {
    const instanceMatrix = mat4CreateFromArray(instance)
    for (const node of meshNodes) {
      nodes.push({
        name: node.data.name,
        mesh: node.data.mesh,
        matrix: Array.from(mat4Multiply(instanceMatrix, node.world)),
      })
    }
  }
  // only needed for the node transforms
  base.dispose()
  return new Model(source.device, {
    name: source.name,
    meta: { ...source.meta },
    meshes: source.meshes,
    nodes,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    scene: 0,
  })
}

/**
 * Length of the z axis of a transform (column major), the scale the engine applies to the LOD distances
 */
function scaleZ(m: ArrayLike<number>): number {
  return Math.hypot(m[8], m[9], m[10])
}
