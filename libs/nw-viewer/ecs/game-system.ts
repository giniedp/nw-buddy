import type { GameHost } from './game-host'
import { AbstractType, ConstructorType, GameType } from './types'

export type GameSystemType<T extends GameSystem = GameSystem> = ConstructorType<T> | AbstractType<T> | GameType<T>

export interface GameSystem {
  game: GameHost
  initialize(game: GameHost): void
  destroy(): void
}
