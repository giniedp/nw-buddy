import type { ConfigSchema } from '../../../config'
import type { ConfigGroup } from './types'

/**
 * The group of the properties without one
 */
const DEFAULT_GROUP = 'General'

/**
 * The property names by {@link ConfigProperty.group}, groups in the order of their first property. Hidden properties
 * (runtime values of the code) are left out.
 */
export function configGroups(schema: ConfigSchema, names: readonly string[]): ConfigGroup[] {
  const result = new Map<string, string[]>()
  for (const name of names) {
    if (schema[name].hidden) {
      continue
    }
    const group = schema[name].group || DEFAULT_GROUP
    if (!result.has(group)) {
      result.set(group, [])
    }
    result.get(group).push(name)
  }
  return [...result].map(([title, names]) => ({ title, names }))
}

/**
 * Fraction digits to show for a step, e.g. 0.0005 shows 4 digits. 3 without a step.
 */
export function stepDecimals(step: number | undefined): number {
  if (!step) {
    return 3
  }
  const text = String(step)
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0
}

/**
 * The numbers of comma separated text, e.g. `1, 2.5, 3`
 */
export function parseNumberList(text: string): number[] {
  return text.split(',').map((it) => Number(it.trim()))
}
