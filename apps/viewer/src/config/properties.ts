/**
 * Common fields of all config properties
 */
export interface ConfigPropertyBase<T> {
  /**
   * What the property does, shown as tooltip in the UI
   */
  description: string
  /**
   * Whether the property can be changed at runtime. Fixed properties are only shown, not stored or loaded.
   */
  editable: boolean
  /**
   * The value used when nothing is stored or the property is reset
   */
  default: T
  /**
   * Section in the UI
   */
  group?: string
  /**
   * Name in the UI, the property name without one
   */
  label?: string
  /**
   * Whether the property applies with the other values, e.g. the framing only with a fixed resolution. The UI hides it
   * otherwise. Always available without one.
   */
  available?: (values: Readonly<Record<string, unknown>>) => boolean
  /**
   * A runtime value for the code (e.g. the fixed exposure of the model viewer): not shown in the settings, not stored
   * or loaded
   */
  hidden?: boolean
  /**
   * How the settings show a choice or a boolean: the default widget (dropdown, checkbox) or one button per value, for
   * a few short options
   */
  display?: 'default' | 'buttons'
}

export interface BooleanProperty extends ConfigPropertyBase<boolean> {
  kind: 'boolean'
}

export interface NumberProperty extends ConfigPropertyBase<number> {
  kind: 'number' | 'integer'
  min?: number
  max?: number
  step?: number
}

export interface ChoiceProperty<T extends string = string> extends ConfigPropertyBase<T> {
  kind: 'choice'
  options: readonly T[]
}

export interface Vec3Property extends ConfigPropertyBase<[number, number, number]> {
  kind: 'vec3'
}

export interface NumberListProperty extends ConfigPropertyBase<number[]> {
  kind: 'numberList'
}

export type ConfigProperty = BooleanProperty | NumberProperty | ChoiceProperty | Vec3Property | NumberListProperty

/**
 * Property declarations by name, the name is unique as it is the key
 */
export type ConfigSchema = Record<string, ConfigProperty>

/**
 * The value types of a schema, by property name
 */
export type ConfigValues<S extends ConfigSchema> = {
  -readonly [K in keyof S]: S[K]['default']
}

type Options<P extends ConfigProperty> = Omit<P, 'kind'>

/**
 * Declares the properties of a config, keeps their exact types
 */
export function defineConfig<const S extends ConfigSchema>(schema: S): S {
  return schema
}

export function boolean(options: Options<BooleanProperty>): BooleanProperty {
  return { kind: 'boolean', ...options }
}

export function number(options: Options<NumberProperty>): NumberProperty {
  return { kind: 'number', ...options }
}

export function integer(options: Options<NumberProperty>): NumberProperty {
  return { kind: 'integer', ...options }
}

export function choice<const T extends string>(
  options: Omit<ChoiceProperty<T>, 'kind' | 'default'> & { default: NoInfer<T> },
): ChoiceProperty<T> {
  return { kind: 'choice', ...options }
}

export function vec3(options: Options<Vec3Property>): Vec3Property {
  return { kind: 'vec3', ...options }
}

export function numberList(options: Options<NumberListProperty>): NumberListProperty {
  return { kind: 'numberList', ...options }
}

/**
 * Converts a value to the type of a property, null if it can not be converted
 *
 * @remarks
 * Numbers are clamped to min / max, integers are rounded. Arrays are copied, so the config never shares them.
 */
export function coerceValue(property: ConfigProperty, value: unknown): unknown {
  switch (property.kind) {
    case 'boolean':
      return typeof value === 'boolean' ? value : null
    case 'number':
    case 'integer': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null
      }
      let result = property.kind === 'integer' ? Math.round(value) : value
      if (property.min != null) {
        result = Math.max(property.min, result)
      }
      if (property.max != null) {
        result = Math.min(property.max, result)
      }
      return result
    }
    case 'choice':
      return property.options.includes(value as string) ? value : null
    case 'vec3':
      return isNumberArray(value) && value.length === 3 ? [value[0], value[1], value[2]] : null
    case 'numberList':
      return isNumberArray(value) ? [...value] : null
  }
}

/**
 * Whether two values of a property are equal, arrays are compared by their elements
 */
export function isSameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, i) => value === b[i])
  }
  return a === b
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((it) => typeof it === 'number' && Number.isFinite(it))
}
