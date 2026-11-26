import { coerceValue, isSameValue, type ConfigProperty, type ConfigSchema, type ConfigValues } from './properties'

/**
 * The part of the Web Storage API the config uses
 */
export type ConfigStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface ConfigOptions {
  /**
   * Key of the storage entry
   */
  storageKey: string
  /**
   * Where the config is saved, defaults to `localStorage`. Null runs on defaults only.
   */
  storage?: ConfigStorage | null
}

type ChangeListener<T> = (value: T) => void

/**
 * Typed runtime settings, declared by a schema (see {@link defineConfig})
 *
 * @remarks
 * Read values from {@link value}, a plain object that stays the same for the whole session,
 * so reading a setting costs the same as reading a constant. {@link set} writes into it.
 *
 * Changes apply right away. They are kept across page loads only after {@link save} (the settings panel saves every
 * change). Only editable, not hidden properties that differ from their default are stored.
 */
export class Config<S extends ConfigSchema> {
  public readonly schema: S

  /**
   * The current values by property name
   */
  public readonly value: Readonly<ConfigValues<S>>

  private readonly values: ConfigValues<S>
  private readonly storageKey: string
  private readonly storage: ConfigStorage | null
  private readonly listeners = new Map<keyof S, Set<ChangeListener<any>>>()

  public constructor(schema: S, options: ConfigOptions) {
    this.schema = schema
    this.storageKey = options.storageKey
    this.storage = options.storage === undefined ? getLocalStorage() : options.storage
    this.values = {} as ConfigValues<S>
    for (const name of this.names) {
      this.values[name] = coerceValue(schema[name], schema[name].default) as ConfigValues<S>[typeof name]
    }
    this.value = this.values
  }

  /**
   * Names of all properties, in declaration order
   */
  public get names(): Array<keyof S & string> {
    return Object.keys(this.schema)
  }

  /**
   * Changes a property at runtime
   *
   * @returns false if the property is not editable or the value is invalid
   */
  public set<K extends keyof S & string>(name: K, value: ConfigValues<S>[K]): boolean {
    const property = this.schema[name]
    if (!property?.editable) {
      console.warn(`config property '${name}' is not editable`)
      return false
    }
    return this.apply(name, value)
  }

  /**
   * Whether a property differs from its default
   */
  public isModified(name: keyof S & string): boolean {
    return !isSameValue(this.values[name], this.schema[name].default)
  }

  /**
   * Sets a property, or all properties, back to the default. Does not save.
   */
  public reset(name?: keyof S & string): void {
    for (const key of name ? [name] : this.names) {
      this.apply(key, this.schema[key].default)
    }
  }

  /**
   * Stores the editable properties that differ from their default
   */
  public save(): void {
    const values: Record<string, unknown> = {}
    for (const name of this.names) {
      if (isStored(this.schema[name]) && this.isModified(name)) {
        values[name] = this.values[name]
      }
    }
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify({ version: 1, values }))
    } catch (err) {
      console.warn('config not saved', err)
    }
  }

  /**
   * Applies the stored values. Unknown, fixed, hidden and invalid entries are ignored.
   *
   * @remarks
   * Properties without a stored value keep their current value, call {@link reset} before to start from defaults.
   */
  public load(): void {
    let stored: { values?: Record<string, unknown> } | null = null
    try {
      const text = this.storage?.getItem(this.storageKey)
      stored = text ? JSON.parse(text) : null
    } catch (err) {
      console.warn('config not loaded', err)
    }
    const values = stored?.values
    if (!values || typeof values !== 'object') {
      return
    }
    for (const name of this.names) {
      if (name in values && isStored(this.schema[name])) {
        this.apply(name, values[name])
      }
    }
  }

  /**
   * Calls the listener whenever the property changes
   *
   * @returns a function that removes the listener
   */
  public onChange<K extends keyof S & string>(name: K, listener: ChangeListener<ConfigValues<S>[K]>): () => void {
    let set = this.listeners.get(name)
    if (!set) {
      set = new Set()
      this.listeners.set(name, set)
    }
    set.add(listener)
    return () => set.delete(listener)
  }

  private apply(name: keyof S & string, value: unknown): boolean {
    const coerced = coerceValue(this.schema[name], value)
    if (coerced === null) {
      console.warn(`invalid value for config property '${name}'`, value)
      return false
    }
    if (isSameValue(coerced, this.values[name])) {
      return true
    }
    this.values[name] = coerced as ConfigValues<S>[typeof name]
    this.listeners.get(name)?.forEach((listener) => listener(coerced))
    return true
  }
}

/**
 * Whether a property is saved and loaded: editable and not a hidden runtime value
 */
function isStored(property: ConfigProperty): boolean {
  return property.editable && !property.hidden
}

function getLocalStorage(): ConfigStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}
