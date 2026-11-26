/**
 * A CAGE element as authored: a condition, an activity or one of their parameter blocks (`Default`, `Conditional`,
 * `IfCondition`, …). The runtime binds the classes, the format keeps the tree.
 */
export interface CageNode {
  /**
   * The element name, e.g. `And`, `IfInput`, `SetMannequinTag`, `Default`
   */
  type: string
  /**
   * Attributes by lower case name: the game reads them without regard to case (rapidxml's upcase table)
   */
  attrs: Record<string, string>
  children: CageNode[]
}

/**
 * Reads an element and its children into a {@link CageNode}
 */
export function readCageNode(el: Element): CageNode {
  const attrs: Record<string, string> = {}
  for (const attribute of el.attributes) {
    attrs[attribute.name.toLowerCase()] = attribute.value
  }
  const children: CageNode[] = []
  for (const child of el.children) {
    children.push(readCageNode(child))
  }
  return { type: el.nodeName, attrs, children }
}

/**
 * An attribute by name (any case), null when the element does not carry it
 */
export function cageAttr(node: CageNode, name: string): string | null {
  return node.attrs[name.toLowerCase()] ?? null
}

/**
 * A string attribute, the fallback when missing
 */
export function cageString(node: CageNode, name: string, fallback = ''): string {
  return cageAttr(node, name) ?? fallback
}

/**
 * A number attribute, read as `%f` / `%d` read it: the number the text starts with; the fallback when missing or
 * not a number
 */
export function cageNumber(node: CageNode, name: string, fallback = 0): number {
  const text = cageAttr(node, name)
  if (text === null) {
    return fallback
  }
  const value = parseFloat(text)
  return Number.isFinite(value) ? value : fallback
}

/**
 * A boolean attribute: a non-zero number, or `true` in any case (CAGEXmlSerializer); the fallback when missing
 */
export function cageBool(node: CageNode, name: string, fallback = false): boolean {
  const text = cageAttr(node, name)
  if (text === null) {
    return fallback
  }
  const trimmed = text.trim()
  const value = parseInt(trimmed, 10)
  if (Number.isFinite(value)) {
    return value !== 0
  }
  return trimmed.toLowerCase() === 'true'
}

/**
 * A `x,y,z` attribute; missing components keep the fallback's
 */
export function cageVec3(node: CageNode, name: string, fallback: [number, number, number] = [0, 0, 0]) {
  const text = cageAttr(node, name)
  const result: [number, number, number] = [fallback[0], fallback[1], fallback[2]]
  if (text === null) {
    return result
  }
  const parts = text.split(',')
  for (let i = 0; i < 3 && i < parts.length; i++) {
    const value = parseFloat(parts[i])
    if (Number.isFinite(value)) {
      result[i] = value
    }
  }
  return result
}

/**
 * The first child of the type (any case), null without one
 */
export function cageChild(node: CageNode, type: string): CageNode | null {
  const lower = type.toLowerCase()
  return node.children.find((it) => it.type.toLowerCase() === lower) ?? null
}
