import type { GameComponent, GameEntity } from '@gglib/ecs'
import type { ViewerAudioAmbienceComponent, ViewerAudioAreaComponent, ViewerAudioTriggerComponent } from '../api'

let nextEmitterId = 1

/**
 * Ambient audio emitter of a slice entity (AudioTriggerComponent). Picked up by the {@link AudioSystem} while the
 * entity is active, the worker decides whether it plays (distance, voice limit, allow and skip lists).
 */
export class AudioEmitterComponent implements GameComponent {
  public entity: GameEntity
  public readonly id = nextEmitterId++
  public readonly config: ViewerAudioTriggerComponent

  public constructor(config: ViewerAudioTriggerComponent) {
    this.config = config
  }
}

/**
 * Instance audio script of a slice entity: an ambience bed loader or an audio area (dungeons, trials, raids).
 * Picked up by the {@link AudioSystem} while the entity is active.
 */
export class AudioScriptComponent implements GameComponent {
  public entity: GameEntity
  public readonly id = nextEmitterId++
  public readonly config: ViewerAudioAmbienceComponent | ViewerAudioAreaComponent

  public constructor(config: ViewerAudioAmbienceComponent | ViewerAudioAreaComponent) {
    this.config = config
  }
}
