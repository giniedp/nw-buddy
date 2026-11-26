import { TimeSystem } from '@gglib/components'
import { GameSystem, type GameQuery, type GameWorld } from '@gglib/ecs'
import { CharacterAnimationSystem } from '../character/CharacterAnimationSystem'
import { GltfAnimationComponent } from './GltfAnimationComponent'
import { GltfCharacterComponent } from './GltfCharacterComponent'
import { GltfSocketsComponent } from './GltfSockets'
import { GltfMannequinComponent } from './mannequin/GltfMannequinComponent'

/**
 * Animates the active {@link GltfAnimationComponent}s, {@link GltfCharacterComponent}s and
 * {@link GltfMannequinComponent}s and places the models on their sockets ({@link GltfSocketsComponent}), needs the
 * {@link CharacterAnimationSystem} for its palette
 */
export class GltfAnimationSystem extends GameSystem {
  private animated: GameQuery
  private gltfCharacters: GameQuery
  private mannequins: GameQuery
  private sockets: GameQuery
  private time: TimeSystem
  private characters: CharacterAnimationSystem

  public initialize(world: GameWorld): void {
    this.time = world.getSystem(TimeSystem)
    this.characters = world.getSystem(CharacterAnimationSystem)
    this.animated = world.query({ scope: 'active', required: [GltfAnimationComponent] })
    this.gltfCharacters = world.query({ scope: 'active', required: [GltfCharacterComponent] })
    this.mannequins = world.query({ scope: 'active', required: [GltfMannequinComponent] })
    this.sockets = world.query({ scope: 'active', required: [GltfSocketsComponent] })
  }

  public override update(): void {
    const palette = this.characters.palette
    if (!palette) {
      return
    }
    const dt = Math.min(this.time.game.delta, 0.25)
    for (const entity of this.animated) {
      entity.component(GltfAnimationComponent).animate(dt)
    }
    for (const entity of this.gltfCharacters) {
      entity.component(GltfCharacterComponent).animate(dt)
    }
    for (const entity of this.mannequins) {
      entity.component(GltfMannequinComponent).animate(dt)
    }
    // the poses are final
    for (const entity of this.sockets) {
      entity.component(GltfSocketsComponent).sockets.update()
    }
    palette.upload()
  }

  public destroy(): void {
    this.animated = null
    this.gltfCharacters = null
    this.mannequins = null
    this.sockets = null
  }
}
