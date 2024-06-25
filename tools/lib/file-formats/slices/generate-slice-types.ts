import { uniqBy } from 'lodash'
import { readJSONFile } from '../../utils/file-utils'
import { walkJsonObjects } from '../../utils/walk-json-object'

function toSafeName(name: string) {
  name = name.replace(/[^a-zA-Z0-9_]/g, '_')
  if (name.match(/^[0-9]/)) {
    name = '$$' + name
  }
  if (name === 'any' || name === 'undefined') {
    name = `$${name}`
  }
  return name
}

function getType(value: unknown): TypeInfo {
  if (value === null) {
    return { identifier: 'null' }
  }
  if (Array.isArray(value)) {
    let result: TypeInfo = { identifier: 'Array', generic: [] }
    for (const it of value) {
      result.generic.push(getType(it))
    }
    result.generic = uniqBy(result.generic, stringifyType)
    return result
  }
  if (typeof value === 'object') {
    if ('__type' in value && typeof value['__type'] === 'string') {
      return { identifier: (value as any)['__type'] }
    }
    return { identifier: 'unknown' }
  }
  return { identifier: typeof value }
}

function mergeTypes(type1: TypeInfo, type2: TypeInfo): TypeInfo {
  if (!type1 || !type2) {
    return type1 || type2
  }

  if (type1.identifier === type2.identifier) {
    if (!type1.generic && !type2.generic) {
      return type1
    }
    type1.generic = uniqBy([...(type1.generic || []), ...(type2.generic || [])], stringifyType)
    return type1
  }
  if (type1.identifier && type2.identifier == null) {
    type2.generic = type2.generic || []
    type2.generic.push(type1)
    type2.generic = uniqBy(type2.generic, stringifyType)
    return type2
  }
  if (type1.identifier == null && type2.identifier) {
    type1.generic = type1.generic || []
    type1.generic.push(type2)
    type1.generic = uniqBy(type1.generic, stringifyType)
    return type1
  }
  return {
    identifier: null,
    generic: [type1, type2],
  }
}

function stringifyType(type: TypeInfo): string {
  if (!type) {
    return 'unknown'
  }
  if (type.identifier) {
    const safeName = toSafeName(type.identifier)
    if (!type.generic?.length) {
      return safeName === 'Array' ? '[]' : safeName
    }
    return `${safeName}<${type.generic.map(stringifyType).join(' | ')}>`
  }
  if (type.generic?.length) {
    return type.generic.map(stringifyType).join(' | ')
  }
  return `unknown`
}

interface TypeInfo {
  identifier: string
  generic?: TypeInfo[]
}

export async function tsFromSliceFiles(files: string[], progress?: (file: string, index: number) => void) {
  const objTypes = new Map<string, Map<string, TypeInfo>>()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (progress) {
      progress(file, i)
    }
    const json = await readJSONFile(file).catch((err) => {
      console.log(`Error reading file: ${file}`)
      return null
    })
    if (!json) {
      continue
    }
    walkJsonObjects(json, (obj: any) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return
      }
      const typeName = String(obj['__type'])
      if (!objTypes.has(typeName)) {
        objTypes.set(typeName, new Map())
      }
      const objType = objTypes.get(typeName)
      const objProps = Object.entries(obj)
      for (const [prop, value] of objProps) {
        const left = objType.get(prop)
        const right = getType(value)
        const merged = mergeTypes(left, right)
        objType.set(prop, merged)
      }
    })
  }

  const buffer: string[] = []
  for (const typeName of Array.from(objTypes.keys()).sort()) {
    const props = objTypes.get(typeName)
    const safeTypeName = toSafeName(typeName)
    buffer.push(`export interface ${safeTypeName} {`)
    for (const propName of Array.from(props.keys()).sort()) {
      const propType = props.get(propName)
      const safePropType = stringifyType(propType)
      const safePropKey = propName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) ? propName : `'${propName}'`
      buffer.push(`  ${safePropKey}: ${safePropType}`)
    }
    buffer.push(`}`)
    buffer.push(`export function is${safeTypeName}(obj: any): obj is ${safeTypeName} {`)
    buffer.push(`  return obj?.['__type'] === '${typeName}'`)
    buffer.push(`}`)
    buffer.push(``)
  }
  return buffer.join('\n')
}
