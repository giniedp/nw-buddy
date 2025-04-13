import type { GameComponent, GameComponentType } from './game-component'
import type { GameHost } from './game-host'
import type { GameSystem, GameSystemType } from './game-system'

export class GameEntity {
  public id: number
  public name: string
  public game: GameHost
  private componentByType = new Map<any, GameComponent>()
  // all known components that are controlled by this entity
  private components: GameComponent[] = []
  // components that are not initialized yet
  private toInitialize: GameComponent[] = []
  // components that are initialized but not enabled yet
  private toActivate: GameComponent[] = []
  // components that are initialized and enabled and ready for action
  private activated: GameComponent[] = []

  private isInitialized: boolean = false
  private isActive: boolean = false
  private isDestoryed: boolean = false

  public get componentCount() {
    return this.components.length
  }

  public get active() {
    return this.isActive
  }

  /**
   * Initializes this entity and binds all components to it.
   * @throws Error if the entity is already initialized.
   */
  public initialize(game: GameHost): this {
    if (this.isInitialized) {
      throw new Error('Entity is already initialized')
    }
    this.game = game
    while (this.toInitialize.length > 0) {
      const component = this.toInitialize.shift()
      if (initializeComponent(component, this)) {
        this.toActivate.push(component)
      }
    }
    this.isInitialized = true
    return this
  }

  /**
   * Activates all components owned by this entity.
   */
  public activate(): this {
    while (this.toActivate.length > 0) {
      const component = this.toActivate.shift()
      enableComponent(component)
      this.activated.push(component)
    }
    this.isActive = true
    return this
  }

  /**
   * Deactivates all components owned by this entity.
   */
  public deactivate(): this {
    while (this.activated.length > 0) {
      const component = this.activated.shift()
      disableComponent(component)
      this.toActivate.push(component)
    }
    this.isActive = false
    return this
  }

  public destroy() {
    this.deactivate()
    for (const component of this.components) {
      destroyComponent(component)
    }
  }

  public addComponents(...components: GameComponent[]): this {
    for (const component of components) {
      this.addComponent(component)
    }
    return this
  }

  public addComponent(component: GameComponent): this
  public addComponent<T extends GameComponent>(type: GameComponentType<T>, component: T): this
  public addComponent(typeOrInstance: any, instance?: any): this {
    const component = instance ? instance : typeOrInstance
    const type = instance ? typeOrInstance : component.constructor

    if (this.isActive) {
      throw new Error('Cannot add component while entity is enabled')
    }
    if (this.components.some((it) => it === component)) {
      console.warn('Component already added to entity', component)
      return this
    }
    if (this.componentByType.has(type)) {
      throw new Error(`Component of type ${type} already exists`)
    }
    this.componentByType.set(type, component)
    this.components.push(component)
    if (!this.isInitialized) {
      this.toInitialize.push(component)
      return this
    }
    if (!initializeComponent(component, this)) {
      return this
    }
    if (!this.isActive) {
      this.toActivate.push(component)
    }
    return this
  }

  public removeComponent(component: GameComponent) {
    if (this.isActive) {
      throw new Error('Cannot remove component while entity is enabled')
    }
    removeFromArray(this.components, component)
    removeFromArray(this.toInitialize, component)
    removeFromArray(this.toActivate, component)
    if ('constructor' in component) {
      this.componentByType.delete(component.constructor)
    }
    component.entity = null
  }

  /**
   * Looks up a component by type on the entity
   * @throws Error if the component is not found
   */
  public component<T extends GameComponent>(type: GameComponentType<T>): T {
    if (this.componentByType.has(type)) {
      return this.componentByType.get(type) as T
    }
    throw new Error(`Component of type ${getTypeName(type)} not found`)
  }

  /**
   * Looks up a component by type on the entity
   * Does not throw an error if the component is not found
   */
  public optionalComponent<T extends GameComponent>(type: GameComponentType<T>): T | null {
    if (this.componentByType.has(type)) {
      return this.componentByType.get(type) as T
    }
    return null
  }

  /**
   * Looks up a component by predicate on the entity
   * Does not throw an error if the component is not found
   */
  public componentBy(predicate: (it: GameComponent) => boolean): GameComponent | null {
    for (const component of this.components) {
      if (predicate(component)) {
        return component
      }
    }
    return null
  }

  /**
   * Looks up a system by type on the game host
   */
  public system<T extends GameSystem>(type: GameSystemType<T>): T {
    return this.game.system(type)
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}

function enableComponent(component: GameComponent) {
  try {
    component.activate()
  } catch (e) {
    console.error('Error enabling component', component, e)
    return false
  }
  return true
}

function disableComponent(component: GameComponent) {
  try {
    component.deactivate()
  } catch (e) {
    console.error('Error disabling component', component, e)
    return false
  }
  return true
}

function initializeComponent(component: GameComponent, entity: GameEntity) {
  try {
    component.initialize(entity)
  } catch (e) {
    console.error('Error initializing component', component, e)
    return false
  }
  return true
}

function destroyComponent(component: GameComponent) {
  try {
    component.destroy()
  } catch (e) {
    console.error('Error destroying component', component, e)
    return false
  }
  return true
}

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

  public initialize(game: GameHost) {
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

  public create() {
    const entity = new GameEntity()
    this.add(entity)
    return entity
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
