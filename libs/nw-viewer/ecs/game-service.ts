import { GameEntity } from './game-entity'
import type { AbstractType, ConstructorType, GameType } from './types'

export type GameServiceType<T extends GameService = GameService> = ConstructorType<T> | AbstractType<T> | GameType<T>

export interface GameService {
  initialize(host: GameServiceContainer): void
  destroy(): void
}

export interface GameServiceQueryOptions {
  /**
   * If true, only queries the system from this container.
   */
  self?: boolean
  /**
   * If true, skips to the parent container.
   */
  skipSelf?: boolean
  /**
   * If true, does not throw an error if the system is not found.
   */
  optional?: boolean
}

export class GameServiceContainer {
  private parent: GameServiceContainer
  private registry: Map<GameServiceType<any>, any> = new Map()
  private toInitialize: GameService[] = []
  private isInitialized = false

  public constructor(parent: GameServiceContainer) {
    this.parent = parent
  }

  public get<T extends GameService>(type: GameServiceType<T>, options?: GameServiceQueryOptions): T {
    if (options?.skipSelf) {
      if (this.parent) {
        return this.parent.get(type, options)
      } else if (options?.optional) {
        return null
      }
      throw new Error(`Service ${getTypeName(type)} not found`)
    }

    const result = this.registry.get(type) as T
    if (result) {
      return result
    }

    if (!options?.self && this.parent) {
      return this.parent.get(type, options)
    }
    if (options?.optional) {
      return null
    }
    throw new Error(`Service ${getTypeName(type)} not found`)
  }

  public add<T extends GameService>(service: T, type?: GameServiceType<T>): this {
    if (type === undefined) {
      type = service.constructor as GameServiceType<T>
    }
    if (type !== null) {
      if (type === Object.constructor) {
        throw new Error('Cannot use Object as service type')
      }
      if (this.registry.has(type)) {
        throw new Error(`Service ${getTypeName(type)} already exists`)
      }
      this.registry.set(type, service)
    }
    if (!this.isInitialized) {
      this.toInitialize.push(service)
    } else {
      initializeService(service, this)
    }
    return this
  }

  public remove(type: GameServiceType): this {
    const service = this.registry.get(type)
    if (service) {
      this.registry.delete(type)
      removeFromArray(this.toInitialize, service)
    }
    return this
  }

  public initialize(): this {
    if (this.isInitialized) {
      throw new Error('Container is already initialized')
    }
    while (this.toInitialize.length > 0) {
      const service = this.toInitialize.shift()
      initializeService(service, this)
    }
    this.isInitialized = true
    return this
  }

  public destroy() {
    for (const service of this.registry.values()) {
      destroyService(service)
    }
    this.registry.clear()
    this.toInitialize.length = 0
  }

  public createEntity() {
    return new GameEntity()
  }
}

function initializeService(service: GameService, host: GameServiceContainer) {
  try {
    service.initialize(host)
  } catch (e) {
    console.error(`Error initializing service ${service.constructor.name}`, e)
  }
}

function destroyService(service: GameService) {
  try {
    service.destroy()
  } catch (e) {
    console.error(`Error destroying service ${service.constructor.name}`, e)
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}

function getTypeName(type: any): string {
  if (typeof type === 'function') {
    return type.name
  } else if (typeof type === 'string') {
    return type
  } else {
    return String(type)
  }
}
