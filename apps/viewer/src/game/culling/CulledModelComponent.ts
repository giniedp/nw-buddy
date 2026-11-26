import { BoundsComponent, TransformComponent } from '@gglib/components'
import { GetComponent, type GameComponent, type GameEntity } from '@gglib/ecs'
import { ResourceOwnership, type Ownable } from '@gglib/graphics'
import type { Model } from '@gglib/model'
import { CullingSystem } from './CullingSystem'

export interface CulledModelComponentOptions {
  /**
   * Model instance owned by this component, with its levels of detail
   */
  model: Model
  /**
   * Instance data of all mesh nodes, 16 floats
   */
  data: Float32Array<ArrayBuffer>
}

/**
 * Renders a static model through the {@link CullingSystem} instead of the scene render path.
 *
 * @remarks
 * The model is culled in the culling worker while the entity is active. It is not part of a spatial index,
 * picking is done by the worker as well. The model is kept up to date with the entity transform.
 */
export class CulledModelComponent implements GameComponent, Ownable {
  public readonly entity: GameEntity
  /**
   * The ownership state of this component, holds the model until the component is destroyed
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)
  public readonly model: Model
  public readonly data: Float32Array<ArrayBuffer>
  /**
   * Record id in the culling worker, 0 while not registered
   */
  public recordId = 0

  private system: CullingSystem
  private transform: TransformComponent

  public constructor(options: CulledModelComponentOptions) {
    this.model = this.ownership.adopt(options.model)
    this.data = options.data
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(CullingSystem)
    this.transform = this.entity.getTransform<TransformComponent>()
    this.entity
      .component(BoundsComponent, GetComponent.Optional)
      ?.setLocalBounds(this.model.boundingSphere, this.model.boundingBox)
  }

  public activate(): void {
    this.model.update(this.transform.world)
    this.system.add(this)
    this.entity.events.on(TransformComponent.onUpdated, this.onTransformUpdated)
  }

  public deactivate(): void {
    this.entity.events.off(TransformComponent.onUpdated, this.onTransformUpdated)
    this.system.remove(this)
  }

  public destroy(): void {
    this.deactivate()
    this.ownership.finalize()
  }

  private onTransformUpdated = () => {
    this.model.update(this.transform.world)
    this.system.remove(this)
    this.system.add(this)
  }
}
