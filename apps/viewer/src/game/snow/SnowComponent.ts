import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { ViewerSnowComponent } from '../../api'
import { SnowSystem } from './SnowSystem'

/**
 * Snow volume (Snow gem SnowComponent), centered on the entity. Registers itself with the {@link SnowSystem} while
 * active, which picks the one global volume like C3DEngine::SetSnowSurfaceParams.
 */
export class SnowComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerSnowComponent

  private system: SnowSystem

  public constructor(data: ViewerSnowComponent) {
    this.data = data
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(SnowSystem)
  }

  public activate(): void {
    if (this.data.enabled) {
      this.system.add(this)
    }
  }

  public deactivate(): void {
    this.system.remove(this)
  }

  public get x(): number {
    return this.entity.getTransform().world[12]
  }

  public get y(): number {
    return this.entity.getTransform().world[13]
  }

  public get z(): number {
    return this.entity.getTransform().world[14]
  }
}
