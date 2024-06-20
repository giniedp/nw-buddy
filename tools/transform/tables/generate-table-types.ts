import { sortBy, uniq } from 'lodash'

export function generateTableTypes(
  samples: Map<string, any[]>,
  {
    enumProps,
  }: {
    enumProps: (type: string) => Record<string, string>
  },
) {
  const result: string[] = []
  const enums = new Map<string, Set<string>>()
  for (const [type, data] of sortBy(Array.from(samples.entries()), ([type]) => type)) {
    const enumMap = enumProps(type)
    const props = new Map<string, Set<string>>()
    for (const obj of data.flat(1)) {
      for (const [key, value] of Object.entries(obj)) {
        if (value == null) {
          continue
        }
        if (!props.has(key)) {
          props.set(key, new Set<string>())
        }
        const enymType = enumMap?.[key]
        const isArray = Array.isArray(value)
        const isObject = !isArray && typeof value === 'object'

        if (enymType) {
          if (!enums.has(enymType)) {
            enums.set(enymType, new Set<string>())
          }
          if (isArray) {
            for (const item of value) {
              enums.get(enymType).add(item)
            }
            props.get(key).add(`${enymType}[]`)
          } else {
            enums.get(enymType).add(String(value))
            props.get(key).add(enymType)
          }
        } else {
          if (isArray) {
            props.get(key).add(makeArrayType(value.map((it) => typeof it)))
          } else if (isObject) {
            props.get(key).add('unknown')
          } else {
            props.get(key).add(typeof value)
          }
        }
      }
    }
    if (!props.size && !enums.size) {
      continue
    }

    result.push(`export interface ${type} {`)
    for (const [key, type] of sortBy(Array.from(props.entries()), ([key, type]) => key)) {
      const finalType = Array.from(type.values()).sort().join(` | `)
      result.push(`  ${escapeName(key)}: ${finalType}`)
    }
    result.push(`}`)
    result.push('')
  }
  for (const [name, values] of sortBy(Array.from(enums.entries()), ([key, values]) => key)) {
    result.push(`export type ${name} =`)
    for (const value of Array.from(values.values()).sort()) {
      result.push(`  | '${value}'`)
    }
  }
  result.push('')
  return result.join('\n')
}

function escapeName(name: string) {
  if (name.match(/^[a-z_][a-z0-9_]*$/i)) {
    return name
  }
  return `'${name}'`
}

function makeArrayType(types: string[]) {
  types = uniq(types)

  if (types.length === 1) {
    return `${types[0]}[]`
  }
  return `Array<${types.join(' | ')}>`
}
