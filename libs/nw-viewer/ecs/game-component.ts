import type { GameEntity } from './game-entity'
import { AbstractType, ConstructorType, GameType } from './types'

export type GameComponentType<T extends GameComponent> = ConstructorType<T> | AbstractType<T> | GameType<T>

export interface GameComponent {
  entity: GameEntity
  initialize(entity: GameEntity): void
  activate(): void
  deactivate(): void
  destroy(): void
}
