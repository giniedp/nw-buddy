import { BoundsComponent, TransformComponent } from '@gglib/components'
import { GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import { ResourceOwnership, type Ownable } from '@gglib/graphics'
import type { Model } from '@gglib/model'
import { InstancedRenderSystem } from './InstancedRenderSystem'

export interface InstancedModelComponentOptions {
  /**
   * Model instance owned by this component
   */
  model: Model
  /**
   * Unique key of the shared model, e.g. model and material url
   */
  key: string
  /**
   * Max distance to the camera, 0 for unlimited
   */
  maxViewDistance: number
}

/**
 * Renders a static model through the {@link InstancedRenderSystem} instead of the scene render path.
 *
 * @remarks
 * Each mesh node of the model becomes an instance in the GPU instance batch while the entity is active.
 * The model is kept up to date with the entity transform, so it can be used for picking.
 */
export class InstancedModelComponent implements GameComponent, Ownable {
  public readonly entity: GameEntity
  /**
   * The ownership state of this component, holds the model until the component is destroyed
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)
  public readonly model: Model
  public readonly key: string
  public readonly maxViewDistance: number

  private system: InstancedRenderSystem
  private transform: TransformComponent
  private handles: number[] = []

  public constructor(options: InstancedModelComponentOptions) {
    this.model = this.ownership.adopt(options.model)
    this.key = options.key
    this.maxViewDistance = options.maxViewDistance
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(InstancedRenderSystem)
    this.transform = this.entity.getTransform<TransformComponent>()
    this.entity
      .component(BoundsComponent, GetComponent.Optional)
      ?.setLocalBounds(this.model.boundingSphere, this.model.boundingBox)
  }

  public activate(): void {
    this.model.update(this.transform.world)
    const batch = this.system.getBatch()
    const nodes = this.model.sceneNodes
    for (let i = 0; i < nodes.length; i++) {
      const mesh = this.model.meshes[nodes[i].data?.mesh]
      if (!mesh) {
        continue
      }
      const group = batch.getGroup(`${this.key}#${i}`, mesh)
      this.handles.push(batch.addInstance(group, nodes[i].world, this.maxViewDistance))
    }
    this.entity.events.on(TransformComponent.onUpdated, this.onTransformUpdated)
  }

  public deactivate(): void {
    this.entity.events.off(TransformComponent.onUpdated, this.onTransformUpdated)
    const batch = this.system.batch
    for (const handle of this.handles) {
      batch?.removeInstance(handle)
    }
    this.handles.length = 0
  }

  public destroy(): void {
    this.deactivate()
    this.ownership.finalize()
  }

  private onTransformUpdated = () => {
    this.model.update(this.transform.world)
    const batch = this.system.batch
    const nodes = this.model.sceneNodes
    let h = 0
    for (let i = 0; i < nodes.length; i++) {
      if (!this.model.meshes[nodes[i].data?.mesh]) {
        continue
      }
      batch.updateInstance(this.handles[h++], nodes[i].world)
    }
  }
}
