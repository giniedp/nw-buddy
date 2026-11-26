import { parseXmlRoot, xmlAttr, xmlBool, xmlChildren } from '../xml/cryXml'

/**
 * A keyboard or mouse binding of an action (CryAction action map `inputdata`)
 */
export interface InputProfileBinding {
  /**
   * The Cry key name: `w`, `lshift`, `space`, `mouse1`, `tilde`, …
   */
  input: string
  onPress: boolean
  onHold: boolean
  onRelease: boolean
}

/**
 * An action of an action map
 */
export interface InputProfileAction {
  map: string
  name: string
  keyboard: InputProfileBinding[]
}

/**
 * A `<profile>` document (`libs/config/defaultprofile.xml` and its includes)
 */
export interface InputProfileDocument {
  actions: InputProfileAction[]
  /**
   * Action maps by name and whether they start enabled (`enable="0"` disables, e.g. `fishing`)
   */
  maps: Array<{ name: string; enabled: boolean }>
  /**
   * The included profiles, in document order
   */
  includes: string[]
}

/**
 * Parses an input profile. Only keyboard and mouse bindings are kept (`keyboard="x"` on the action, or `<keyboard>`
 * with `<inputdata input="x"/>` children); the flags of an `inputdata` override those of its `<keyboard>`, which
 * override the action's. Shift modifiers and analog compares are not read.
 */
export function parseInputProfile(xml: string): InputProfileDocument {
  const root = parseXmlRoot(xml, 'profile')
  const result: InputProfileDocument = { actions: [], maps: [], includes: [] }
  for (const el of xmlChildren(root)) {
    if (el.nodeName === 'include') {
      const file = xmlAttr(el, 'filename')
      if (file) {
        result.includes.push(file)
      }
      continue
    }
    if (el.nodeName !== 'actionmap') {
      continue
    }
    const map = xmlAttr(el, 'name') ?? ''
    result.maps.push({ name: map, enabled: xmlBool(el, 'enable') ?? true })
    for (const action of xmlChildren(el, 'action')) {
      result.actions.push({ map, name: xmlAttr(action, 'name') ?? '', keyboard: readKeyboard(action) })
    }
  }
  return result
}

/**
 * The file an include names: the game stores `*.inputprofilexml` includes as `.xml`
 */
export function inputProfileIncludePath(file: string): string {
  return file.toLowerCase().replace(/\.inputprofilexml$/, '.xml')
}

function readKeyboard(action: Element): InputProfileBinding[] {
  const flags = readFlags(action, { onPress: false, onHold: false, onRelease: false })
  const result: InputProfileBinding[] = []
  const direct = xmlAttr(action, 'keyboard')
  if (direct) {
    result.push({ input: direct, ...flags })
  }
  for (const keyboard of xmlChildren(action, 'keyboard')) {
    const keyboardFlags = readFlags(keyboard, flags)
    for (const data of xmlChildren(keyboard, 'inputdata')) {
      const input = xmlAttr(data, 'input')
      if (input && input.trim()) {
        result.push({ input, ...readFlags(data, keyboardFlags) })
      }
    }
  }
  return result
}

function readFlags(el: Element, fallback: Omit<InputProfileBinding, 'input'>): Omit<InputProfileBinding, 'input'> {
  return {
    onPress: xmlBool(el, 'onPress') ?? fallback.onPress,
    onHold: xmlBool(el, 'onHold') ?? fallback.onHold,
    onRelease: xmlBool(el, 'onRelease') ?? fallback.onRelease,
  }
}
