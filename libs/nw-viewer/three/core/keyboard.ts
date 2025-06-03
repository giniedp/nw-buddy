import { EventEmitter } from './events'

/**
 * Options for {@link KeyboardListener}
 *
 * @public
 */
export interface KeyboardOptions {
  /**
   * The element at which to listen for input events
   */
  eventTarget?: EventTarget
  /**
   * Events that are captured and re-triggered on the {@link KeyboardListener} instance
   */
  proxyEvents?: string[]
}

/**
 * A captured keyboard state holding all keys which are pressed
 *
 * @public
 */
export type KeyboardState = Set<KeyboardKey>

/**
 * Captures key events and tracks keyboard state.
 *
 * @remarks
 * It does so by listening to
 * the `keypress`, `keydown` and `keyup` events and tracks the pressed buttons. On each recognized
 * state change the `changed` event is triggered.
 *
 * @public
 */
export class KeyboardListener extends EventEmitter {
  /**
   * The target element on which to listen for keyboard events.
   */
  protected eventTarget: EventTarget = document

  /**
   * Tracked set of pressed {@link KeyboardKey} enum values
   *
   * @remarks
   * Values are {@link KeyboardKey} enum values (numbers)
   */
  public readonly keys: ReadonlySet<KeyboardKey> = new Set<KeyboardKey>()

  /**
   * Tracked set of pressed {@link KeyboardKey} enum keys
   *
   * @remarks
   * Values are {@link KeyboardKey} enum keys (strings). These are the
   * untransformed original values as returned by the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | KeyboardEvent.code}
   * thus the list may contain values which are not yet enumerated by {@link KeyboardKey} enum.
   */
  public readonly codes: ReadonlySet<string> = new Set<string>()

  /**
   * Collection of html events that are captured and re-triggered on this instance
   */
  protected proxiedEvents = ['keypress', 'keydown', 'keyup']

  /**
   * Is called on the `keydown` event and marks the `event.code` as pressed
   */
  protected onKeyDown = (e: KeyboardEvent) => this.setKeyPressed(e)
  /**
   * Is called on the `keyup` event and marks the `event.code` as released
   */
  protected onKeyUp = (e: KeyboardEvent) => this.setKeyReleased(e)
  /**
   * Is called when `document` or `window` loose focus e.g. user switches to another tab or application
   */
  protected onNeedsClear = (e: Event) => this.clearState(e)
  /**
   * Triggers the Event that occurred on the element
   */
  protected onEvent: EventListener = (e: Event) => this.notify(e.type, this, e)

  /**
   * Initializes the Keyboard with given options and activates the capture listeners
   */
  constructor(options?: KeyboardOptions) {
    super()
    this.eventTarget = options?.eventTarget ?? this.eventTarget
    this.proxiedEvents = (options?.proxyEvents ?? this.proxiedEvents) || []
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.eventTarget.addEventListener('keydown', this.onKeyDown)
    this.eventTarget.addEventListener('keyup', this.onKeyUp)
    // visibility events
    document.addEventListener('visibilitychange', this.onNeedsClear)
    document.addEventListener('contextmenu', this.onNeedsClear)
    document.addEventListener('blur', this.onNeedsClear)
    window.addEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.proxiedEvents) {
      this.eventTarget.addEventListener(name, this.onEvent)
    }
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update state events
    this.eventTarget.removeEventListener('keydown', this.onKeyDown)
    this.eventTarget.removeEventListener('keyup', this.onKeyUp)
    // visibility events
    document.removeEventListener('visibilitychange', this.onNeedsClear)
    document.removeEventListener('contextmenu', this.onNeedsClear)
    document.removeEventListener('blur', this.onNeedsClear)
    window.removeEventListener('blur', this.onNeedsClear)
    // delegated events
    for (let name of this.proxiedEvents) {
      this.eventTarget.removeEventListener(name, this.onEvent)
    }
  }

  /**
   * Marks the given `code` as being pressed and triggers the `changed` event
   */
  protected setKeyPressed(e: KeyboardEvent) {
    const key = KeyboardListener.getKeyboardKey(e)
    if (!this.keys.has(key)) {
      ;(this.keys as Set<number>).add(key)
      ;(this.codes as Set<string>).add(e.code)
      this.onChanged(e)
    }
  }
  /**
   * Marks the given `keyCode` as not being pressed and triggers the `changed` event
   */
  protected setKeyReleased(e: KeyboardEvent) {
    const code = KeyboardListener.getKeyboardKey(e)
    if (this.keys.has(code)) {
      ;(this.keys as Set<number>).delete(code)
      ;(this.codes as Set<string>).delete(e.code)
      this.onChanged(e)
    }
  }
  /**
   * Clears the state and triggers the `changed` event
   */
  public clearState(e?: Event) {
    if (this.keys.size > 0) {
      ;(this.keys as Set<number>).clear()
      ;(this.codes as Set<string>).clear()
      this.onChanged(e)
    }
  }

  /**
   * Gets the {@link KeyboardKey} from given event
   *
   * @remarks
   * Prefers the value of {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | KeyboardEvent.code}
   * if available. If it is not available then
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode | KeyboardEvent.keyCode} is used
   * and remapped if possible.
   *
   * @param e - The keyboard event
   */
  public static getKeyboardKey(e: KeyboardEvent): KeyboardKey {
    if ('code' in e) {
      return KeyboardKey[e.code] as unknown as KeyboardKey
    } else {
      return KeyCodeToKey[e['keyCode']]
    }
  }

  protected onChanged(e?: KeyboardEvent | Event) {
    this.notify('changed', this, e)
  }
}

export class Keyboard {

  /**
   * The keyboard listener
   */
  public readonly listener: KeyboardListener

  /**
   * Pressed keys in current frame
   *
   * @remarks
   * This is swapped with the `oldState` property each frame
   */
  public state = new Set<KeyboardKey>()

  /**
   * Pressed keys in last frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public statePrev = new Set<KeyboardKey>()

  private addToNewState = (k: KeyboardKey) => this.state.add(k)

  constructor(options: KeyboardOptions = {}) {
    this.listener = new KeyboardListener(options)
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public update() {
    [this.statePrev, this.state] = [this.state, this.statePrev]
    this.state.clear()
    this.listener.keys.forEach(this.addToNewState)
  }

  /**
   * Detects whether a specific key is currently pressed
   *
   * @param key - The key to check
   */
  public isPressed(key: KeyboardKey): boolean {
    return this.state.has(key)
  }

  /**
   * Detects whether a specific key is currently pressed but was released in in last frame
   *
   * @param key - The key to check
   */
  public justPressed(key: KeyboardKey): boolean {
    return this.statePrev.has(key) && this.state.has(key)
  }

  /**
   * Detects whether a specific key is currently released
   *
   * @param key - The key to check
   */
  public isReleased(key: KeyboardKey): boolean {
    return this.state.has(key)
  }

  /**
   * Detects whether a specific key is currently released but was pressed in in last frame
   *
   * @param key - The key to check
   */
  public justReleased(key: KeyboardKey): boolean {
    return this.statePrev.has(key) && !this.state.has(key)
  }
}
/**
 * Enumeration of keyboard keys
 *
 * @public
 * @remarks
 * This is a mapping from {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values | KeyboardEvent.code}
 * values
 */
export enum KeyboardKey {
  // Alphanumeric Section

  Backquote = 1,
  Backslash,
  Backspace,
  BracketLeft,
  BracketRight,
  Comma,
  Digit0 = 48,
  Digit1,
  Digit2,
  Digit3,
  Digit4,
  Digit5,
  Digit6,
  Digit7,
  Digit8,
  Digit9,
  Equal,
  IntlBackslash,
  IntlRo,
  IntlYen,
  KeyA = 65,
  KeyB,
  KeyC,
  KeyD,
  KeyE,
  KeyF,
  KeyG,
  KeyH,
  KeyI,
  KeyJ,
  KeyK,
  KeyL,
  KeyM,
  KeyN,
  KeyO,
  KeyP,
  KeyQ,
  KeyR,
  KeyS,
  KeyT,
  KeyU,
  KeyV,
  KeyW,
  KeyX,
  KeyY,
  KeyZ,
  Minus,
  Period,
  Quote,
  Semicolon,
  Slash,

  AltLeft,
  AltRight,
  CapsLock,
  ContextMenu,
  ControlLeft,
  ControlRight,
  Enter,
  MetaLeft,
  MetaRight,
  ShiftLeft,
  ShiftRight,
  Space,
  Tab,

  Convert,
  KanaMode,
  Lang1,
  Lang2,
  Lang3,
  Lang4,
  Lang5,
  NonConvert,

  //  Control Pad Section

  Delete,
  End,
  Help,
  Home,
  Insert,
  PageDown,
  PageUp,

  // Arrow Pad Section

  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,

  // Numpad Section

  NumLock,
  Numpad0,
  Numpad1,
  Numpad2,
  Numpad3,
  Numpad4,
  Numpad5,
  Numpad6,
  Numpad7,
  Numpad8,
  Numpad9,
  NumpadAdd,
  NumpadBackspace,
  NumpadClear,
  NumpadClearEntry,
  NumpadComma,
  NumpadDecimal,
  NumpadDivide,
  NumpadEnter,
  NumpadEqual,
  NumpadHash,
  NumpadMemoryAdd,
  NumpadMemoryClear,
  NumpadMemoryRecall,
  NumpadMemoryStore,
  NumpadMemorySubtract,
  NumpadMultiply,
  NumpadParenLeft,
  NumpadParenRight,
  NumpadStar,
  NumpadSubtract,

  // Function Section

  Escape,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
  Fn,
  FnLock,
  PrintScreen,
  ScrollLock,
  Pause,

  // Media Keys

  BrowserBack,
  BrowserFavorites,
  BrowserForward,
  BrowserHome,
  BrowserRefresh,
  BrowserSearch,
  BrowserStop,
  Eject,
  LaunchApp1,
  LaunchApp2,
  LaunchMail,
  MediaPlayPause,
  MediaSelect,
  MediaStop,
  MediaTrackNext,
  MediaTrackPrevious,
  Power,
  Sleep,
  AudioVolumeDown,
  AudioVolumeMute,
  AudioVolumeUp,
  WakeUp,
}

const KeyCodeToKey = Object.freeze({
  8: KeyboardKey.Backspace,
  9: KeyboardKey.Tab,
  13: KeyboardKey.Enter,
  16: KeyboardKey.ShiftLeft,
  17: KeyboardKey.ControlLeft,
  18: KeyboardKey.AltLeft,
  19: KeyboardKey.Pause,
  20: KeyboardKey.CapsLock,
  27: KeyboardKey.Escape,
  32: KeyboardKey.Space,
  33: KeyboardKey.PageUp,
  34: KeyboardKey.PageDown,
  35: KeyboardKey.End,
  36: KeyboardKey.Home,
  37: KeyboardKey.ArrowLeft,
  38: KeyboardKey.ArrowUp,
  39: KeyboardKey.ArrowRight,
  40: KeyboardKey.ArrowDown,
  45: KeyboardKey.Insert,
  46: KeyboardKey.Delete,
  48: KeyboardKey.Digit0,
  49: KeyboardKey.Digit1,
  50: KeyboardKey.Digit2,
  51: KeyboardKey.Digit3,
  52: KeyboardKey.Digit4,
  53: KeyboardKey.Digit5,
  54: KeyboardKey.Digit6,
  55: KeyboardKey.Digit7,
  56: KeyboardKey.Digit8,
  57: KeyboardKey.Digit9,
  65: KeyboardKey.KeyA,
  66: KeyboardKey.KeyB,
  67: KeyboardKey.KeyC,
  68: KeyboardKey.KeyD,
  69: KeyboardKey.KeyE,
  70: KeyboardKey.KeyF,
  71: KeyboardKey.KeyG,
  72: KeyboardKey.KeyH,
  73: KeyboardKey.KeyI,
  74: KeyboardKey.KeyJ,
  75: KeyboardKey.KeyK,
  76: KeyboardKey.KeyL,
  77: KeyboardKey.KeyM,
  78: KeyboardKey.KeyN,
  79: KeyboardKey.KeyO,
  80: KeyboardKey.KeyP,
  81: KeyboardKey.KeyQ,
  82: KeyboardKey.KeyR,
  83: KeyboardKey.KeyS,
  84: KeyboardKey.KeyT,
  85: KeyboardKey.KeyU,
  86: KeyboardKey.KeyV,
  87: KeyboardKey.KeyW,
  88: KeyboardKey.KeyX,
  89: KeyboardKey.KeyY,
  90: KeyboardKey.KeyZ,
  91: KeyboardKey.MetaLeft,
  92: KeyboardKey.MetaRight,
  93: KeyboardKey.MediaSelect,
  96: KeyboardKey.Numpad0,
  97: KeyboardKey.Numpad1,
  98: KeyboardKey.Numpad2,
  99: KeyboardKey.Numpad3,
  100: KeyboardKey.Numpad4,
  101: KeyboardKey.Numpad5,
  102: KeyboardKey.Numpad6,
  103: KeyboardKey.Numpad7,
  104: KeyboardKey.Numpad8,
  105: KeyboardKey.Numpad9,
  106: KeyboardKey.NumpadMultiply,
  107: KeyboardKey.NumpadAdd,
  109: KeyboardKey.NumpadSubtract,
  110: KeyboardKey.NumpadDecimal,
  111: KeyboardKey.NumpadDivide,
  112: KeyboardKey.F1,
  113: KeyboardKey.F2,
  114: KeyboardKey.F3,
  115: KeyboardKey.F4,
  116: KeyboardKey.F5,
  117: KeyboardKey.F6,
  118: KeyboardKey.F7,
  119: KeyboardKey.F8,
  120: KeyboardKey.F9,
  121: KeyboardKey.F10,
  122: KeyboardKey.F11,
  123: KeyboardKey.F12,
  144: KeyboardKey.NumLock,
  145: KeyboardKey.ScrollLock,
  186: KeyboardKey.Semicolon,
  187: KeyboardKey.Equal,
  188: KeyboardKey.Comma,
  189: KeyboardKey.Minus,
  190: KeyboardKey.Period,
  191: KeyboardKey.Slash,
  192: KeyboardKey.Backquote,
  219: KeyboardKey.BracketLeft,
  220: KeyboardKey.Backslash,
  221: KeyboardKey.BracketRight,
  222: KeyboardKey.IntlRo,
})
