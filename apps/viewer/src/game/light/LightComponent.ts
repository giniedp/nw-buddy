import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { ViewerLightConfig } from '../../api'

export type SceneLightType = 'Point' | 'Projector' | 'Area'

export function isSceneLightType(type: string): type is SceneLightType {
  return type === 'Point' || type === 'Projector' || type === 'Area'
}

/**
 * Marks an entity as a scene light. Picked up by the {@link LightSystem} while the entity is active.
 *
 * @remarks
 * The light is placed and oriented by the entity world transform.
 * Following the CryEngine convention, projector and area lights emit along the local +X axis.
 * Area lights span their width along local Y and their height along local Z.
 */
export class LightComponent implements GameComponent {
  public entity: GameEntity
  public readonly type: SceneLightType
  public readonly config: ViewerLightConfig
  public enabled = true
  /**
   * Multiplies the diffuse multiplier of the config (not of ambient lights), e.g. a user control of some lights
   */
  public scale = 1

  public constructor(config: ViewerLightConfig) {
    this.config = config
    this.type = config.type as SceneLightType
  }
}
