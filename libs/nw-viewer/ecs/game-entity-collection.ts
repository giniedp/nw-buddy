import { GameEntity } from './game-entity'
import type { GameServiceContainer } from './game-service'

export class GameEntityCollection {
  public readonly entities: GameEntity[] = []

  public add(entity: GameEntity) {
    this.entities.push(entity)
  }

  public remove(entity: GameEntity) {
    removeFromArray(this.entities, entity)
  }

  public clear() {
    this.entities.length = 0
  }

  public length() {
    return this.entities.length
  }

  public initialize(game: GameServiceContainer) {
    for (const entity of this.entities) {
      entity.initialize(game)
    }
  }

  public activate() {
    for (const entity of this.entities) {
      entity.activate()
    }
  }

  public deactivate() {
    for (const entity of this.entities) {
      entity.deactivate()
    }
  }

  public destroy() {
    for (const entity of this.entities) {
      entity.destroy()
    }
    this.clear()
  }

  public create(name?: string, id?: number | string) {
    const entity = new GameEntity()
    entity.name = name
    entity.id = id
    this.add(entity)
    return entity
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}
