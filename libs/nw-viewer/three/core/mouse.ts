import { getTime, PointerLock } from './dom'
import { EventEmitter } from './events'

/**
 * Constructor options for {@link MouseListener}
 *
 * @public
 */
export interface MouseOptions {
  /**
   * The target element where the events should be captured at. Defaults to `document.documentElement`
   */
  eventTarget?: EventTarget
  /**
   * The reference element that the pointer coordinates should be relative to.
   */
  captureTarget?: HTMLElement
  /**
   * List of events that are captured on the `eventTarget` and re-emitted on this instance
   */
  proxyEvents?: string[]
}

/**
 * The captured Mouse state
 *
 * @public
 */
export interface MouseState {
  /**
   * Time when the mouse state was captured
   */
  timestamp: number
  /**
   * The mouse event that caused the mouse state change
   */
  event: MouseEvent | null
  /**
   * Mouse X position in client coordinates
   */
  clientX: number
  /**
   * Mouse Y position in client coordinates
   */
  clientY: number
  /**
   * Mouse X position in normalized client coordinates
   */
  normalizedX: number
  /**
   * Mouse Y position in normalized client coordinates
   */
  normalizedY: number
  /**
   * The value of the scroll wheel
   */
  wheel: number
  /**
   * Left middle and right mouse button states
   */
  buttons: boolean[]
}

/**
 * Captures the mouse state.
 *
 * @remarks
 * The mouse events are captured at the given {@link MouseOptions.eventTarget}. Using these events a mouse state
 * is recorded. On each recognized  state change the `changed` event is triggered.
 *
 * @public
 */
export class MouseListener extends EventEmitter {
  /**
   * The target eventTarget at which to listen for mouse events. Defaults to `document.documentElement`
   */
  public readonly eventTarget: EventTarget = document.documentElement

  /**
   * The reference element that the pointer coordinates should be relative to. Defaults to given `eventTarget` or `document`
   */
  public readonly captureTarget: HTMLElement = null

  /**
   * The current Mouse state
   */
  public readonly state: MouseState = {
    event: null,
    timestamp: 0,
    clientX: 0,
    clientY: 0,
    normalizedX: 0,
    normalizedY: 0,
    wheel: 0,
    buttons: [false, false, false],
  }

  /**
   * {@link https://developer.mozilla.org/de/docs/Web/Events | Event} names that are delegated to this instance.
   */
  public readonly proxiedEvents: ReadonlyArray<string> = [
    'click',
    'contextmenu',
    'dblclick',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'mousewheel',
    'wheel'
  ]

  /**
   * Listener for any {@link https://developer.mozilla.org/de/docs/Web/Events | Event}
   * see {@link MouseListener.proxiedEvents}.
   */
  protected readonly onEvent: EventListener = (e) => this.notify(e.type, this, e)
  /**
   * Listener that issues a clear state operation on this instance
   */
  protected readonly onClearStateListener: EventListener = this.onClearState.bind(this)
  /**
   * Listener that issues a clear state operation on this instance
   */
  protected readonly onCaptureStateListener: EventListener = this.onCaptureState.bind(this)
  /**
   *
   */
  protected readonly lockApi = new PointerLock()

  /**
   * Initializes the Mouse with given options and activates the capture listeners
   */
  constructor(options?: MouseOptions) {
    super()
    this.setup(options)
  }

  /**
   * Re-initializes this instance. Can be used to switch eventTarget on the fly
   */
  public setup(options?: MouseOptions) {
    this.deactivate()
    Object.assign<MouseListener, Partial<MouseListener>>(this, {
      eventTarget: options?.eventTarget ?? this.eventTarget,
      captureTarget: options?.captureTarget ?? this.captureTarget,
      proxiedEvents: options?.proxyEvents ?? Array.from(this.proxiedEvents),
    })
    this.activate()
  }

  /**
   * Activates the capture listeners
   */
  public activate() {
    this.deactivate()
    // update state events
    this.eventTarget.addEventListener('wheel', this.onCaptureStateListener)
    this.eventTarget.addEventListener('mousemove', this.onCaptureStateListener)
    this.eventTarget.addEventListener('mousedown', this.onCaptureStateListener)
    this.eventTarget.addEventListener('mouseup', this.onCaptureStateListener)
    // visibility events
    document.addEventListener('visibilitychange', this.onClearStateListener)
    document.addEventListener('contextmenu', this.onClearStateListener)
    document.addEventListener('blur', this.onClearStateListener)
    window.addEventListener('blur', this.onClearStateListener)
    // delegated events
    for (let name of this.proxiedEvents) {
      this.eventTarget.addEventListener(name, this.onEvent)
    }
    // pointerlock events
    this.lockApi.onChange(this.onEvent)
    this.lockApi.onError(this.onEvent)
  }

  /**
   * Deactivates the capture listeners
   */
  public deactivate() {
    // update logic events
    this.eventTarget.removeEventListener('wheel', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mousemove', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mousedown', this.onCaptureStateListener)
    this.eventTarget.removeEventListener('mouseup', this.onCaptureStateListener)
    // visibility events
    document.removeEventListener('visibilitychange', this.onClearStateListener)
    document.removeEventListener('contextmenu', this.onClearStateListener)
    document.removeEventListener('blur', this.onClearStateListener)
    window.removeEventListener('blur', this.onClearStateListener)
    // delegated events
    for (let name of this.proxiedEvents) {
      this.eventTarget.removeEventListener(name, this.onEvent)
    }
    // pointerlock events
    this.lockApi.offChange(this.onEvent)
    this.lockApi.offError(this.onEvent)
  }

  /**
   * Gets a copy of the captured state
   *
   * @param out - Where the state is written to
   */
  public copyState<T>(out: T): T & MouseState
  /**
   * Gets a copy of the captured state
   */
  public copyState(): MouseState
  /**
   * Gets a copy of the captured state
   */
  public copyState(out: any = {}): MouseState {
    out.timestamp = this.state.timestamp
    out.event = this.state.event
    out.clientX = this.state.clientX
    out.clientY = this.state.clientY
    out.normalizedX = this.state.normalizedX
    out.normalizedY = this.state.normalizedY
    out.wheel = this.state.wheel
    out.buttons = out.buttons || []
    out.buttons.length = 3
    out.buttons[0] = this.state.buttons[0]
    out.buttons[1] = this.state.buttons[1]
    out.buttons[2] = this.state.buttons[2]
    return out
  }

  /**
   * Locks the mouse to the current element.
   *
   * @remarks
   * Mouse cursor will be invisible and only the `movementX` and `movementY` state properties are updated.
   */
  public lock() {
    if (!this.lockApi.isSupported) {
      console.warn('[Mouse] pointerlock api is not available')
      return
    }
    if (this.eventTarget === this.lockApi.pointerLockElement) {
      return
    }
    if (this.eventTarget instanceof Element) {
      this.lockApi.requestLock(this.captureTarget || this.eventTarget)
    } else {
      console.warn('[Mouse] lock() is only available for elements of type "Element"')
    }
  }
  /**
   * Checks for an active mouse lock in the document
   *
   * @returns true if any document element has a mouse lock
   */
  public get isLocked(): boolean {
    return !!this.lockApi.pointerLockElement
  }
  /**
   * Releases the active mouse lock in the document
   */
  public unlock() {
    this.lockApi.exitLock()
  }

  /**
   * Adds a callback that is call on 'changed' event
   *
   * @param fn - the callback function
   */
  public onChanged(fn: (m: MouseListener, e?: Event) => void) {
    this.on('changed', fn)
  }

  protected onCaptureState(e: MouseEvent) {
    this.state.event = e
    this.state.timestamp = getTime()
    this.capturePointer(e, this.state)
    this.captureButtons(e, this.state)
    this.captureWheel(e, this.state)
    this.notify('changed', this, e)
  }

  protected capturePointer(e: MouseEvent, state: MouseState) {
    const client = this.captureTarget || this.eventTarget
    if (this.isLocked) {
      state.clientX += e.movementX
      state.clientY += e.movementY
    } else if (client instanceof HTMLElement) {
      const rect = client.getBoundingClientRect()
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      state.clientX = e.pageX - (rect.left + scrollLeft)
      state.clientY = e.pageY - (rect.top + scrollTop)
    }
    if (client instanceof HTMLElement) {
      state.normalizedX = state.clientX / client.clientWidth
      state.normalizedY = state.clientY / client.clientHeight
    }
  }

  protected captureButtons(e: MouseEvent, state: MouseState) {
    const isDown = e.type === 'mousedown'
    const isUp = e.type === 'mouseup'
    if (isDown || isUp) {
      if (e.which !== undefined) {
        state.buttons[e.which - 1] = isDown
      } else if (e.button !== undefined) {
        state.buttons[e.button] = isDown
      }
    }
  }

  protected captureWheel(e: MouseEvent, state: MouseState) {
    state.wheel = state.wheel || 0
    if (e.type === 'wheel') {
      if (e.detail) {
        state.wheel += -1 * e.detail
      } else if ((e as any)['deltaY']) {
        state.wheel += (e as any)['deltaY'] / 120
      } else {
        state.wheel += 0
      }
    }
  }

  /**
   * Clears the tracked state
   */
  protected onClearState() {
    this.state.wheel = 0
    this.state.buttons.length = 3
    this.state.buttons[0] = false
    this.state.buttons[1] = false
    this.state.buttons[2] = false
    this.notify('changed', this, null)
  }
}

/**
 * @public
 */
export const MouseButton = Object.freeze({
  Left: 0,
  Middle: 1,
  Right: 2,
})

/**
 * @public
 */
export const MouseButtonName = Object.freeze({
  0: 'Left',
  1: 'Middle',
  2: 'Right',
})


export class Mouse {

  /**
   * The mouse listener
   */
  public readonly listener: MouseListener

  /**
   * Pressed state in current frame
   *
   * @remarks
   * This is swapped with the `oldState` property each frame
   */
  public state: MouseState

  /**
   * Pressed state in previous frame
   *
   * @remarks
   * This is swapped with the `newState` property each frame
   */
  public statePrev: MouseState

  /**
   * Whether x and y non-normalized client coordinates should be scaled with `window.devicePixelRatio`
   */
  public usePixelRatio: boolean = false
  /**
   * The pixel ratio to use if `usePixelRatio` is `true`
   */
  public customPixelRatio: number = null

  constructor(options: MouseOptions = {}) {
    this.listener = new MouseListener(options)
    this.state = this.listener.copyState({})
    this.statePrev = this.listener.copyState({})
  }

  /**
   * Swaps the `oldState` and `newState` properties and updates the `newState`
   */
  public update() {
    let toUpdate = this.statePrev
    this.statePrev = this.state
    this.state = toUpdate
    this.listener.copyState(toUpdate)
  }

  /**
   * X position in client coordinates in current frame
   */
  public get x() {
    return this.state.clientX
  }

  /**
   * Y position in client coordinates in current frame
   */
  public get y() {
    return this.state.clientY
  }

  /**
   * X position in normalized client coordinates in current frame
   */
  public get xNormalized() {
    return this.state.normalizedX
  }

  /**
   * Y position in normalized client coordinates in current frame
   */
  public get yNormalized() {
    return this.state.normalizedY
  }

  /**
   * Movement along x axis in client coordinates since last frame
   */
  public get dx() {
    return this.state.clientX - this.statePrev.clientX
  }

  /**
   * Movement along y axis in client coordinates since last frame
   */
  public get dy() {
    return this.state.clientY - this.statePrev.clientY
  }

  /**
   * Movement along x axis in normalized client coordinates since last frame
   */
  public get dxNormalized() {
    return this.state.normalizedX - this.statePrev.normalizedX
  }

  /**
   * Movement along y axis in normalized client coordinates since last frame
   */
  public get dyNormalized() {
    return this.state.normalizedY - this.statePrev.normalizedY
  }

  /**
   * Wheel value in current frame
   */
  public get wheel() {
    return this.state.wheel
  }

  /**
   * Wheel movement since last frame
   */
  public get wheelDelta() {
    return this.state.wheel - this.statePrev.wheel
  }

  /**
   * Indicates whether left mouse button is pressed in this frame
   */
  public get leftButtonIsPressed(): boolean {
    return this.state.buttons[0]
  }

  /**
   * Indicates whether left mouse button is pressed in this frame but was released last frame
   */
  public get leftButtonJustPressed(): boolean {
    return !this.statePrev.buttons[0] && this.state.buttons[0]
  }

  /**
   * Indicates whether left mouse button is released in this frame
   */
  public get leftButtonIsReleased(): boolean {
    return this.state.buttons[0]
  }

  /**
   * Indicates whether left mouse button is released in this frame but was pressed last frame
   */
  public get leftButtonJustReleased(): boolean {
    return this.statePrev.buttons[0] && !this.state.buttons[0]
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame
   */
  public get middleButtonIsPressed(): boolean {
    return this.state.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is pressed in this frame but was released last frame
   */
  public get middleButtonJustPressed(): boolean {
    return !this.statePrev.buttons[1] && this.state.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is released in this frame
   */
  public get middleButtonIsReleased(): boolean {
    return this.state.buttons[1]
  }

  /**
   * Indicates whether middle mouse button is released in this frame but was pressed last frame
   */
  public get middleButtonJustReleased(): boolean {
    return this.statePrev.buttons[1] && !this.state.buttons[1]
  }

  /**
   * Indicates whether right mouse button is pressed in this frame
   */
  public get rightButtonIsPressed(): boolean {
    return this.state.buttons[2]
  }

  /**
   * Indicates whether right mouse button is pressed in this frame but was released last frame
   */
  public get rightButtonJustPressed(): boolean {
    return !this.statePrev.buttons[2] && this.state.buttons[2]
  }

  /**
   * Indicates whether right mouse button is released in this frame
   */
  public get rightButtonIsReleased(): boolean {
    return this.state.buttons[2]
  }

  /**
   * Indicates whether right mouse button is released in this frame but was pressed last frame
   */
  public get rightButtonJustReleased(): boolean {
    return this.statePrev.buttons[2] && !this.state.buttons[2]
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame
   */
  public buttonIsPressed(button: number): boolean {
    return this.state.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is pressed in this frame but was released last frame
   */
  public buttonJustPressed(button: number): boolean {
    return !this.statePrev.buttons[button] && this.state.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is released in this frame
   */
  public buttonIsReleased(button: number): boolean {
    return this.state.buttons[button]
  }

  /**
   * Indicates whether specific mouse button is released in this frame but was pressed last frame
   */
  public buttonJustReleased(button: number): boolean {
    return this.statePrev.buttons[button] && !this.state.buttons[button]
  }
}
