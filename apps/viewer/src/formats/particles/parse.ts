import { ParticleCurve, type ParticleCurveKey } from './curve'

/**
 * A particle effect node of a library, with its unparsed params
 */
export interface ParticleEffectNode {
  /**
   * Name of the node, for top level nodes including the folder path, e.g. `Global.Candle_Flame_01`
   */
  name: string
  /**
   * Full name including the library and parent names, e.g. `Buildables.Global.Candle_Flame_01.Glow`
   */
  fullName: string
  /**
   * The xml attributes of `<Params>`, null for folders and nodes without params
   */
  attrs: Record<string, string> | null
  children: ParticleEffectNode[]
}

export interface ParticleLibraryDocument {
  name: string
  version: number
  effects: ParticleEffectNode[]
}

/**
 * Parses a CryEngine particle library (`libs/particles/*.xml`)
 */
export function parseParticleLibrary(xml: string): ParticleLibraryDocument {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Invalid particle library xml: ${error.textContent}`)
  }
  const root = doc.documentElement
  if (root?.tagName !== 'ParticleLibrary') {
    throw new Error(`Invalid particle library xml: expected root element 'ParticleLibrary' but was '${root?.tagName}'`)
  }
  const name = root.getAttribute('Name') || ''
  const effects: ParticleEffectNode[] = []
  for (const el of Array.from(root.children)) {
    if (el.tagName === 'Particles') {
      effects.push(readEffect(el, name))
    }
  }
  return {
    name,
    version: Number(root.getAttribute('ParticleVersion')) || 0,
    effects,
  }
}

function readEffect(el: Element, parentName: string): ParticleEffectNode {
  const name = el.getAttribute('Name') || ''
  const fullName = parentName ? `${parentName}.${name}` : name
  let attrs: Record<string, string> | null = null
  const children: ParticleEffectNode[] = []
  for (const child of Array.from(el.children)) {
    if (child.tagName === 'Params') {
      attrs = {}
      for (const attr of Array.from(child.attributes)) {
        attrs[attr.name] = attr.value
      }
    } else if (child.tagName === 'Childs') {
      for (const it of Array.from(child.children)) {
        if (it.tagName === 'Particles') {
          children.push(readEffect(it, fullName))
        }
      }
    }
  }
  return { name, fullName, attrs, children }
}

/**
 * Finds an effect by its full name, e.g. `Buildables.Global.Candle_Flame_01`
 *
 * @remarks
 * The first part is the library name. Top level names may contain dots (folders), children are nested.
 * Names are compared case insensitive.
 */
export function findParticleEffect(lib: ParticleLibraryDocument, fullName: string): ParticleEffectNode | null {
  const parts = fullName.split('.')
  if (parts.length > 1 && parts[0].toLowerCase() === lib.name.toLowerCase()) {
    parts.shift()
  }
  for (let i = parts.length; i > 0; i--) {
    const top = parts.slice(0, i).join('.').toLowerCase()
    let found = lib.effects.find((it) => it.name.toLowerCase() === top)
    for (const name of parts.slice(i)) {
      if (!found) {
        break
      }
      found = found.children.find((it) => it.name.toLowerCase() === name.toLowerCase())
    }
    if (found) {
      return found
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Value grammar of CryEngine TypeInfo strings
// ---------------------------------------------------------------------------

/**
 * A parsed TypeInfo value: an optional positional (base) value and named members, e.g.
 * `0.5,Random=0.2,ParticleAge=(v=1;t=1)` or `X=(1,Random=2),Y=3`
 */
export interface TypeInfoValue {
  base: string | null
  named: Record<string, string>
}

/**
 * Splits a string at the separator, ignoring separators inside parentheses
 */
export function splitTopLevel(value: string, separator = ','): string[] {
  const result: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const c = value[i]
    if (c === '(') {
      depth++
    } else if (c === ')') {
      depth--
    } else if (c === separator && depth === 0) {
      result.push(value.slice(start, i))
      start = i + 1
    }
  }
  result.push(value.slice(start))
  return result
}

/**
 * Whether a TypeInfo value is a plain vector, e.g. `(y=0.23,z=0.07)` or `x=1,z=2`
 */
export function isVectorValue(value: string | null | undefined): boolean {
  if (!value) {
    return false
  }
  const info = parseTypeInfo(value)
  const keys = Object.keys(info.named)
  return info.base == null && keys.length > 0 && keys.every((it) => /^[xyzXYZ]$/.test(it))
}

/**
 * Removes one pair of enclosing parentheses
 */
export function unwrap(value: string): string {
  value = value.trim()
  if (value.startsWith('(') && value.endsWith(')')) {
    // only if the parentheses enclose the whole value
    let depth = 0
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '(') {
        depth++
      } else if (value[i] === ')') {
        depth--
        if (depth === 0 && i < value.length - 1) {
          return value
        }
      }
    }
    return value.slice(1, -1)
  }
  return value
}

export function parseTypeInfo(value: string | null | undefined): TypeInfoValue {
  const result: TypeInfoValue = { base: null, named: {} }
  if (value == null) {
    return result
  }
  for (const part of splitTopLevel(unwrap(value))) {
    const eq = topLevelIndexOf(part, '=')
    if (eq < 0) {
      if (part.trim()) {
        result.base = part.trim()
      }
    } else {
      result.named[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
    }
  }
  return result
}

function topLevelIndexOf(value: string, char: string) {
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    const c = value[i]
    if (c === '(') {
      depth++
    } else if (c === ')') {
      depth--
    } else if (c === char && depth === 0) {
      return i
    }
  }
  return -1
}

export function parseNumber(value: string | null | undefined, fallback: number): number {
  if (value == null || value === '') {
    return fallback
  }
  const result = Number(unwrap(value))
  return Number.isFinite(result) ? result : fallback
}

export function parseBool(value: string | null | undefined, fallback: boolean): boolean {
  if (value == null || value === '') {
    return fallback
  }
  const v = unwrap(value).toLowerCase()
  return v === 'true' || v === '1'
}

/**
 * Parses a vector `x=1,y=2,z=3`, or a color `(x=1,y=0.5,z=0)`, or a scalar for all components
 *
 * @remarks
 * TypeInfo strings only contain the members that differ from the default, missing components keep the fallback.
 * E.g. a color `(y=0.23,z=0.07)` with the default white is `(1, 0.23, 0.07)`.
 */
export function parseVec3(
  value: string | null | undefined,
  fallback: [number, number, number],
): [number, number, number] {
  if (value == null || value === '') {
    return [...fallback]
  }
  const info = parseTypeInfo(value)
  if (info.base != null && !Object.keys(info.named).length) {
    const s = parseNumber(info.base, NaN)
    if (Number.isFinite(s)) {
      return [s, s, s]
    }
  }
  return [
    parseNumber(info.named.x ?? info.named.X ?? info.named.r, fallback[0]),
    parseNumber(info.named.y ?? info.named.Y ?? info.named.g, fallback[1]),
    parseNumber(info.named.z ?? info.named.Z ?? info.named.b, fallback[2]),
  ]
}

/**
 * Parses curve keys `t=0.5,v=1,d=0,s=0,flags=36;…`. Empty keys are `t=0,v=0`.
 */
export function parseCurve(value: string | null | undefined, dimension: 1 | 3): ParticleCurve | null {
  if (value == null || !unwrap(value).trim()) {
    return null
  }
  const keys: ParticleCurveKey[] = []
  for (const part of splitTopLevel(unwrap(value), ';')) {
    const info = parseTypeInfo(part)
    let v: number[]
    if (dimension === 3) {
      v = info.named.v != null ? parseVec3(info.named.v, [0, 0, 0]) : [0, 0, 0]
    } else {
      v = [parseNumber(info.named.v, 0)]
    }
    keys.push({
      t: parseNumber(info.named.t, 0),
      v,
      d: parseNumber(info.named.d, 0),
      s: parseNumber(info.named.s, 0),
      flags: parseNumber(info.named.flags, 0),
    })
  }
  return keys.length ? new ParticleCurve(keys, dimension) : null
}
