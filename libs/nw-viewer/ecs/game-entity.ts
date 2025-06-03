import type { GameComponent, GameComponentType } from './game-component'
import { GameService, GameServiceContainer, GameServiceQueryOptions, GameServiceType } from './game-service'

export class GameEntity {
  public id: number | string
  public name: string
  public game: GameServiceContainer
  private componentByType = new Map<any, GameComponent>()
  private typeByComponent = new Map<GameComponent, any>()
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
  private services: GameService[] = []

  public get componentCount() {
    return this.components.length
  }

  public get active() {
    return this.isActive
  }

  public get destroyed() {
    return this.isDestoryed
  }

  /**
   * Initializes this entity by calling initialize on all components.
   * This can be called only once in the lifetime of the entity.
   *
   * @throws Error if the entity is already initialized.
   */
  public initialize(game: GameServiceContainer): this {
    if (this.isInitialized) {
      throw new Error('Entity is already initialized')
    }
    this.game = new GameServiceContainer(game).initialize()
    if (this.services.length ) {
      for (const service of this.services) {
        this.game.add(service)
      }
    }
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

  /**
   * Deactivates this entity and destroys all components.
   */
  public destroy(): this {
    this.deactivate()
    for (const component of this.components) {
      destroyComponent(component)
    }
    this.isDestoryed = true
    return this
  }

  /**
   * Checks whether the component is already added to the entity.
   */
  public contains(component: GameComponent): boolean {
    return this.components.includes(component)
  }

  /**
   * Checks whether the entity has a component of the given type.
   */
  public has<T extends GameComponent>(type: GameComponentType<T>): boolean {
    return this.componentByType.has(type)
  }

  /**
   * Adds multiple components to the entity and registers them in the 'by type' lookup registry.
   * @see addComponent
   */
  public addComponents(...components: GameComponent[]): this {
    for (const component of components) {
      this.addComponent(component)
    }
    return this
  }

  public withServices(...services: GameService[]): this {
    if (this.isInitialized) {
      throw new Error('Cannot add services after entity is initialized')
    }
    this.services = services
    return this
  }

  /**
   * Adds a component to the entity and registers it in the 'by type' lookup registry.
   * - Only one component of a given type can be added and registered at the entity.
   * - Multiple components of the same type can only be added by explicitly setting the type to `null`.
   *
   * If a given component is an instance of a class, the type parameter is optional and will be inferred from its constructor.
   *
   * If a given component is a plain object, the type parameter must be provided.
   *
   * @param component The component to add
   * @param type The type to associate the component with. Use `null` to bypass the lookup registry and add multiple instances of same type.
   * @throws Error if the component is already added to the entity
   * @throws Error if the component type is already registered
   */
  public addComponent<T extends GameComponent>(component: GameComponent, type?: GameComponentType<T> | null): this {
    if (type == undefined && component.constructor) {
      if (component.constructor === Object) {
        throw new Error('Plain objects must have an explicit type provided when added as components')
      }
      type = component.constructor as GameComponentType<T>
    }

    if (this.isActive) {
      throw new Error('Cannot add component while entity is enabled')
    }
    if (this.components.includes(component)) {
      console.warn('Component already added to entity', component)
      return this
    }
    if (type) {
      if (this.componentByType.has(type)) {
        throw new Error(`Component of type ${type} already exists`)
      }
      this.componentByType.set(type, component)
      this.typeByComponent.set(component, type)
    }
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

  /**
   * Removes a component from the entity. Removes its reference from the 'by type' lookup registry.
   */
  public removeComponent(component: GameComponent) {
    if (this.isActive) {
      throw new Error('Cannot remove component while entity is enabled')
    }
    removeFromArray(this.components, component)
    removeFromArray(this.toInitialize, component)
    removeFromArray(this.toActivate, component)
    if ('constructor' in component) {
      if (component === this.componentByType.get(component.constructor)) {
        this.componentByType.delete(component.constructor)
      }
    }
    component.entity = null
  }

  /**
   * Looks up a component by type on the entity
   * @throws Error if the component is not found in the entity
   */
  public component<T extends GameComponent>(type: GameComponentType<T>, optional?: boolean): T {
    if (this.componentByType.has(type)) {
      return this.componentByType.get(type) as T
    }
    if (optional) {
      return null
    }
    throw new Error(`Component of type ${getTypeName(type)} not found`)
  }

  /**
   * Looks up a component by predicate on the entity
   * Does not throw an error if the component is not found
   */
  public find(predicate: (it: GameComponent) => boolean): GameComponent | null {
    for (const component of this.components) {
      if (predicate(component)) {
        return component
      }
    }
    return null
  }

  /**
   * Looks up a service by type on the game host
   */
  public service<T extends GameService>(type: GameServiceType<T>, options?: GameServiceQueryOptions): T {
    return this.game.get(type, options)
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

function getTypeName(type: any): string {
  if (typeof type === 'function') {
    return type.name
  } else if (typeof type === 'string') {
    return type
  } else {
    return String(type)
  }
}
