import type { ActivatableComponent, GameComponent, GameEntity } from '@gglib/ecs'
import { GetComponent } from '@gglib/ecs'
import { vec3, type IVec3 } from '@gglib/math'
import type { ViewerColliderComponent, ViewerShape, ViewerVolumeComponent } from '../../api'
import type { RnrAsset } from '../../formats/rnr/types'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { rnrDebugShapes, viewerShapeDebugShapes, type CollisionDebugShape } from './collisionDebug'
import { CollisionSystem } from './CollisionSystem'

export type CollisionLoadState = 'idle' | 'loading' | 'loaded' | 'failed'

/**
 * Collision shape of an entity: a rigid body collider or a query / trigger volume.
 *
 * The shape is either a primitive (available immediately) or a RockNRoll shape asset that is loaded on demand
 * by the {@link CollisionSystem}. Shapes are drawn on the collision debug layers.
 */
export class CollisionComponent implements GameComponent, ActivatableComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerColliderComponent | ViewerVolumeComponent
  public readonly isVolume: boolean
  /**
   * File path of the shape asset, if the shape is not a primitive
   */
  public readonly rnr: string | null
  /**
   * Primitive shape in entity space
   */
  public readonly primitive: ViewerShape | null
  /**
   * Loaded shape asset
   */
  public asset: RnrAsset | null = null
  public state: CollisionLoadState = 'idle'

  private system: CollisionSystem
  private debug: DebugShapeComponent | null

  public get layer() {
    return this.isVolume ? DebugLayer.CollisionVolume : DebugLayer.Collision
  }

  public constructor(data: ViewerColliderComponent | ViewerVolumeComponent) {
    this.data = data
    this.isVolume = data.type === 'Volume'
    this.rnr = data.type === 'Collider' && data.rnr ? data.rnr : null
    this.primitive = this.rnr ? null : (data.shape ?? null)
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(CollisionSystem)
    this.debug = this.entity.component(DebugShapeComponent, GetComponent.Optional)
    if (this.primitive) {
      this.state = 'loaded'
      this.addDebugShapes(viewerShapeDebugShapes(this.primitive))
    }
  }

  public activate(): void {
    this.system.add(this)
  }

  public deactivate(): void {
    this.system.remove(this)
  }

  public destroy(): void {
    this.system?.remove(this)
  }

  /**
   * Loads the shape asset through the collision worker, called by the CollisionSystem
   */
  public async load() {
    if (!this.rnr || this.state !== 'idle') {
      return
    }
    this.state = 'loading'
    try {
      this.asset = await this.system.loadShape(this.rnr)
      this.state = 'loaded'
      for (const shape of this.asset.shapes) {
        this.addDebugShapes(rnrDebugShapes(shape, this.rnr))
      }
    } catch (err) {
      this.state = 'failed'
      console.warn('collision shape not loaded', this.rnr, err)
    }
  }

  /**
   * World position of the entity
   */
  public getPosition(out: IVec3 = vec3()) {
    const world = this.entity.getTransform().world
    out.x = world[12]
    out.y = world[13]
    out.z = world[14]
    return out
  }

  private addDebugShapes(shapes: CollisionDebugShape[]) {
    if (!this.debug) {
      return
    }
    const color = collisionColor(this.data)
    for (const shape of shapes) {
      this.debug.add({
        ...shape,
        layer: this.layer,
        color,
        solid: true,
        alpha: 0.05,
      })
    }
  }
}

function collisionColor(data: ViewerColliderComponent | ViewerVolumeComponent): IVec3 {
  if (data.type === 'Volume') {
    switch (data.volume) {
      case 'hit':
        return vec3(1, 0.2, 0.2)
      case 'detection':
        return vec3(1, 0.6, 0)
      default:
        return vec3(0.3, 0.5, 1)
    }
  }
  switch (data.filter) {
    case 'Structure':
      return vec3(0.2, 1, 0.4)
    case 'Terrain':
      return vec3(0.7, 0.5, 0.2)
    case 'CharacterOnly':
      return vec3(1, 1, 0)
    default:
      return vec3(0, 1, 1)
  }
}
