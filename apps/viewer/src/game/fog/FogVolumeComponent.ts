import type { GameComponent, GameEntity } from '@gglib/ecs'
import { mat4CreateScaleXYZ, type Mat4 } from '@gglib/math'
import type { ViewerFogVolumeComponent } from '../../api'
import { FogVolumeSystem } from './FogVolumeSystem'

/**
 * Local fog volume (LmbrCentral FogVolumeComponent), injected into the froxel volumetric fog (plan phase 8).
 * Registers itself with the {@link FogVolumeSystem} while active.
 */
export class FogVolumeComponent implements GameComponent {
  public readonly entity: GameEntity
  public readonly data: ViewerFogVolumeComponent

  private system: FogVolumeSystem

  public constructor(data: ViewerFogVolumeComponent) {
    this.data = data
  }

  public initialize(): void {
    this.system = this.entity.world.getSystem(FogVolumeSystem)
  }

  public activate(): void {
    this.system.add(this)
  }

  public deactivate(): void {
    this.system.remove(this)
  }

  /**
   * Entity world transform of the volume, the volume extent is {@link fogVolumeLocalScale} in entity space
   */
  public get world(): Mat4 {
    return this.entity.getTransform().world
  }
}

/**
 * Entity space scale of a unit shape to the volume extent: the box size for a unit box ([-0.5, 0.5]), half the size
 * for a unit sphere (radius 1)
 */
export function fogVolumeLocalScale(data: ViewerFogVolumeComponent, unitShape: 'box' | 'sphere'): Mat4 {
  const f = unitShape === 'box' ? 1 : 0.5
  return mat4CreateScaleXYZ(data.size[0] * f, data.size[1] * f, data.size[2] * f)
}
