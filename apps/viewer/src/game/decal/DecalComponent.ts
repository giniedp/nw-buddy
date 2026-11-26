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
import { Device, type Material, Mesh, type ResourceScope } from '@gglib/graphics'
import { mat4CreateScaleXYZ, mat4CreateTranslation, mat4Identity, mat4Multiply, vec3, type Mat4 } from '@gglib/math'
import { Model } from '@gglib/model'
import type { ViewerDecalComponent } from '../../api'
import { ViewerConfig } from '../../config'
import { ContentService, materialAssetPath } from '../../content'
import { createInstanceData, MaterialLayerMasks, NwRenderVariant } from '../../material/common'
import { IllumMaterial } from '../../material/IllumMaterial'
import { getFlatNormalTexture } from '../../material/utils'
import { CulledModelComponent } from '../culling/CulledModelComponent'
import { CullingSystem } from '../culling/CullingSystem'
import { DecalSystem } from './DecalSystem'

export type DecalState = 'idle' | 'loading' | 'built' | 'unsupported' | 'failed'

/**
 * Decal matrix of the game (DecalRenderNode::SetDecalProperties): the entity rotation and scale (the decal size, the
 * radius is 1), scaled by the depth along the projection axis z, translated by the entity transform of the offset.
 * Maps the decal box (DecalSystem) into the world.
 */
export function decalMatrix(entityWorld: Mat4, data: ViewerDecalComponent): Mat4 {
  const offset = data.offset ?? [0, 0, 0]
  const local = mat4Multiply(
    mat4CreateTranslation(vec3(offset[0], offset[1], offset[2])),
    mat4CreateScaleXYZ(1, 1, data.depth ?? 1),
  )
  return mat4Multiply(entityWorld, local)
}

/**
 * Draw order of a projected decal like the game's stable sort of the deferred decals (DeffDecalSort): decals without a
 * normal map first, then by ascending sort priority (0-255), so a higher priority draws on top
 */
export function decalRenderOrder(device: Device, material: Material, data: ViewerDecalComponent): number {
  const hasNormalMap = material instanceof IllumMaterial && material.NormalMap !== getFlatNormalTexture(device)
  return (hasNormalMap ? 256 : 0) + Math.min(Math.max(data.sortPriority ?? 16, 0), 255)
}

/**
 * Projected decal (LmbrCentral DecalComponent). Loads the %DECAL material when activated and spawns the decal box,
 * which the DecalPass blends into the GBuffer (plan 7.7). Non-deferred decals (projection types 0 and 1) are rendered
 * the same way (user decision 7.1).
 */
export class DecalComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerDecalComponent
  public state: DecalState = 'idle'

  private content: ContentService
  /**
   * Owns everything this component loads, the scope of the region or level
   */
  private scope: ResourceScope
  private scheduler: SchedulerSystem
  private task: ScheduledTask
  private child: GameEntity

  public constructor(data: ViewerDecalComponent) {
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
          console.warn('decal material failed', this.data.material, err)
          this.state = 'failed'
        } else {
          // the game's decal pass takes any material, the viewer implements it for Illum
          if (task.context instanceof IllumMaterial) {
            task.context.ensureProjectedDecalEffects()
          }
          if (task.context.getEffect(NwRenderVariant.ProjectedDecal)) {
            this.build(task.context)
          } else {
            console.warn('decal material without projected decal effect', this.data.material, task.context.name)
            this.state = 'unsupported'
          }
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
  }

  private build(material: Material) {
    const device = this.entity.service(Device)
    const geometry = this.entity.world.getSystem(DecalSystem).boxGeometry(device)
    const mesh = new Mesh(device, {
      name: this.entity.name,
      geometries: [geometry],
      materials: [material],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    const model = new Model(device, {
      name: this.entity.name,
      meshes: [mesh],
      nodes: [{ name: this.entity.name, mesh: 0, matrix: Array.from(mat4Identity()) }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    })
    const maxViewDistance = (this.data.maxViewDistance || 0) * (this.data.viewDistanceMultiplier || 1)
    const data = createInstanceData({ maxViewDistance, decalOpacity: this.data.opacity ?? 1 })
    const culled = this.canCullInWorker(model)
    // the parent is set after the layer flags: attaching to the active entity activates the child, and the culling
    // system batches the model by its layer right then (CullingSystem.add)
    this.child = this.entity.world.createEntity({
      name: 'DecalBox',
      transform: new TransformComponent({
        keepWorld: true,
        world: decalMatrix(this.entity.getTransform().world, this.data),
      }),
      components: [
        new BoundsComponent(),
        // culled models are not part of the spatial index, the culling worker culls and picks them
        ...(culled
          ? [new CulledModelComponent({ model, data })]
          : [new SpatialNodeComponent(), new InstanceDataComponent({ data }), new ModelComponent({ model })]),
      ],
    })
    // the entity layer replaces the material layer: the box is in the DecalPass list only, not in the mesh decal list
    // of its %DECAL material
    this.child.layer = MaterialLayerMasks.ProjectedDecal
    this.child.renderOrder = decalRenderOrder(device, material, this.data)
    this.child.getTransform<TransformComponent>().setParent(this.entity.getTransform())
    this.state = 'built'
  }

  private canCullInWorker(model: Model): boolean {
    return !!this.entity.world.getSystem(CullingSystem, { optional: true })?.canCull(model)
  }
}
