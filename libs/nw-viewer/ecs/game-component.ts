import type { GameEntity } from './game-entity'
import { AbstractType, ConstructorType, GameType } from './types'

export type GameComponentType<T extends GameComponent> = ConstructorType<T> | AbstractType<T> | GameType<T>

export interface GameComponent {
  /**
   * The game entity that this component is attached to.
   */
  entity: GameEntity
  /**
   * Initializes the component allowing it to setup references to other components and services
   */
  initialize(entity: GameEntity): void
  /**
   * Activates the component, allowing it to listen for game events and hooks into the game loop
   */
  activate(): void
  /**
   * Deactivates the component, stopping all its activities
   */
  deactivate(): void
  /**
   * Destroys the component, cleaning up any resources it has allocated
   */
  destroy(): void
}
