/**
 * Helpers to read CryEngine XML documents (`.bspace`, `.comb`, `.adb`, controller and tag definitions, action lists)
 * the way the engine does: element names compare with case, attribute names without (CXmlNode::getAttr).
 */

/**
 * Parses an xml document and returns its root element
 *
 * @param rootName - the expected root element name, checked when given
 */
export function parseXmlRoot(xml: string, rootName?: string): Element {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Invalid xml: ${error.textContent}`)
  }
  const root = doc.documentElement
  if (rootName && root.nodeName !== rootName) {
    throw new Error(`Expected <${rootName}> but was <${root.nodeName}>`)
  }
  return root
}

/**
 * The value of an attribute, found without regard to case, null when the element does not carry it
 */
export function xmlAttr(el: Element, name: string): string | null {
  const exact = el.getAttribute(name)
  if (exact !== null) {
    return exact
  }
  const lower = name.toLowerCase()
  for (const attribute of el.attributes) {
    if (attribute.name.toLowerCase() === lower) {
      return attribute.value
    }
  }
  return null
}

/**
 * A number attribute, null when missing or not a number
 */
export function xmlNumber(el: Element, name: string): number | null {
  const value = xmlAttr(el, name)
  if (value === null || value.trim() === '') {
    return null
  }
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

/**
 * A boolean attribute: `1` and `true` (any case) are true, null when missing
 */
export function xmlBool(el: Element, name: string): boolean | null {
  const value = xmlAttr(el, name)
  if (value === null) {
    return null
  }
  const text = value.trim().toLowerCase()
  return text === 'true' || (text !== '' && Number(text) !== 0 && Number.isFinite(Number(text)))
}

/**
 * The child elements, those with the name only when given
 */
export function xmlChildren(el: Element | null | undefined, name?: string): Element[] {
  if (!el) {
    return []
  }
  const result: Element[] = []
  for (const child of el.children) {
    if (!name || child.nodeName === name) {
      result.push(child)
    }
  }
  return result
}

/**
 * The first child element with the name, null without one
 */
export function xmlChild(el: Element | null | undefined, name: string): Element | null {
  return xmlChildren(el, name)[0] ?? null
}
