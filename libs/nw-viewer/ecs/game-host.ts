import { GameEntity } from './game-entity'
import type { GameSystem, GameSystemType } from './game-system'

export class GameHost {
  private registry: Map<GameSystemType<any>, any> = new Map()
  private toInitialize: GameSystem[] = []
  private isInitialized = false

  public system<T extends GameSystem>(type: GameSystemType<T>): T {
    return this.registry.get(type) as T
  }

  public addSystems(...service: GameSystem[]): this {
    for (const s of service) {
      this.addSystem(s)
    }
    return this
  }

  public addSystem(service: GameSystem): void
  public addSystem<T extends GameSystem>(type: GameSystemType<T>, service: T): void
  public addSystem(typeOrInstance: any, instance?: any) {
    const service = instance ? instance : typeOrInstance
    const type = instance ? typeOrInstance : service.constructor as GameSystemType

    if (this.registry.has(type)) {
      throw new Error(`Service ${type} already exists`)
    }
    this.registry.set(type, service)
    if (!this.isInitialized) {
      this.toInitialize.push(service)
    } else {
      initializeService(service, this)
    }
  }

  public removeService(type: GameSystemType) {
    const service = this.registry.get(type)
    if (service) {
      this.registry.delete(type)
      removeFromArray(this.toInitialize, service)
    }
  }

  public initialize() {
    if (this.isInitialized) {
      throw new Error('Game system is already initialized')
    }
    while (this.toInitialize.length > 0) {
      const service = this.toInitialize.shift()
      initializeService(service, this)
    }
    this.isInitialized = true
  }

  public createEntity() {
    const entity = new GameEntity()
    entity.game = this
    return entity
  }
}

function initializeService(service: GameSystem, game: GameHost) {
  try {
    service.game = game
    service.initialize(game)
  } catch (e) {
    console.error(`Error initializing service ${service.constructor.name}`, e)
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}
