import { inputProfileIncludePath, type InputProfileDocument } from '../../../formats/cage'

/**
 * The game's input profile (keyboard and mouse bindings of the CAGE input names)
 */
export const DEFAULT_INPUT_PROFILE = 'libs/config/defaultprofile.xml'

/**
 * Loads a profile and the profiles it includes (one level, as the game's default profile uses them). An include that
 * fails to load is skipped.
 */
export async function loadInputProfiles(
  load: (path: string) => Promise<InputProfileDocument>,
  path = DEFAULT_INPUT_PROFILE,
): Promise<InputProfileDocument[]> {
  const root = await load(path)
  const includes = await Promise.all(root.includes.map((it) => load(inputProfileIncludePath(it)).catch(() => null)))
  return [root, ...includes.filter((it): it is InputProfileDocument => !!it)]
}

/**
 * Cry key names (`inputdata input`, `keyboard="x"`) to DOM key codes
 */
const CRY_KEYS: Record<string, string> = {
  space: 'Space',
  lshift: 'ShiftLeft',
  rshift: 'ShiftRight',
  lctrl: 'ControlLeft',
  rctrl: 'ControlRight',
  lalt: 'AltLeft',
  ralt: 'AltRight',
  tab: 'Tab',
  enter: 'Enter',
  escape: 'Escape',
  backspace: 'Backspace',
  tilde: 'Backquote',
  capslock: 'CapsLock',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  minus: 'Minus',
  equals: 'Equal',
  comma: 'Comma',
  period: 'Period',
  slash: 'Slash',
  backslash: 'Backslash',
  semicolon: 'Semicolon',
  apostrophe: 'Quote',
  lbracket: 'BracketLeft',
  rbracket: 'BracketRight',
  insert: 'Insert',
  delete: 'Delete',
  home: 'Home',
  end: 'End',
  pgup: 'PageUp',
  pgdn: 'PageDown',
}

/**
 * The mouse buttons the profile names
 */
export type CageMouseButton = 'mouse1' | 'mouse2' | 'mouse3'

function domCode(input: string): string | null {
  const key = input.trim().toLowerCase()
  if (/^[a-z]$/.test(key)) {
    return `Key${key.toUpperCase()}`
  }
  if (/^[0-9]$/.test(key)) {
    return `Digit${key}`
  }
  if (/^f([1-9]|1[0-2])$/.test(key)) {
    return key.toUpperCase()
  }
  if (/^np_[0-9]$/.test(key)) {
    return `Numpad${key.slice(3)}`
  }
  return CRY_KEYS[key] ?? null
}

interface Binding {
  /**
   * A DOM key code or a mouse button
   */
  input: string
  /**
   * The input name, lower case
   */
  action: string
  onPress: boolean
  onHold: boolean
  onRelease: boolean
}

/**
 * What the keyboard and mouse hold this frame
 */
export interface CageKeyState {
  isPressed(input: string): boolean
  justPressed(input: string): boolean
  justReleased(input: string): boolean
}

/**
 * Turns keys and mouse buttons into the CAGE input names their profile binds (CryAction action maps): an action is
 * active on the frame its key goes down (`onPress`), every frame it is held (`onHold`) and the frame it goes up
 * (`onRelease`). Action maps that start disabled (e.g. `fishing`) are left out, and so are keys the viewer keeps for
 * itself.
 */
export class CageKeyboard {
  private readonly bindings: Binding[] = []

  public constructor(profiles: InputProfileDocument[], reserved: { keys?: string[]; mouse?: CageMouseButton[] } = {}) {
    const reservedInputs = new Set<string>([...(reserved.keys ?? []), ...(reserved.mouse ?? [])])
    for (const profile of profiles) {
      const disabled = new Set(profile.maps.filter((it) => !it.enabled).map((it) => it.name))
      for (const action of profile.actions) {
        if (disabled.has(action.map)) {
          continue
        }
        for (const binding of action.keyboard) {
          const key = binding.input.trim().toLowerCase()
          const input = key === 'mouse1' || key === 'mouse2' || key === 'mouse3' ? key : domCode(key)
          if (!input || reservedInputs.has(input)) {
            continue
          }
          this.bindings.push({
            input,
            action: action.name.toLowerCase(),
            onPress: binding.onPress,
            onHold: binding.onHold,
            onRelease: binding.onRelease,
          })
        }
      }
    }
  }

  /**
   * The names bound to an input (DOM code or mouse button), for display
   */
  public actionsOf(input: string): string[] {
    return this.bindings.filter((it) => it.input === input).map((it) => it.action)
  }

  /**
   * Fills `out` with the input names active this frame
   */
  public update(state: CageKeyState, out: Set<string>): Set<string> {
    out.clear()
    for (const binding of this.bindings) {
      const input = binding.input
      if (
        (binding.onPress && state.justPressed(input)) ||
        (binding.onHold && state.isPressed(input)) ||
        (binding.onRelease && state.justReleased(input))
      ) {
        out.add(binding.action)
      }
    }
    return out
  }
}
