import type { CharacterViewer } from './character-viewer'

/**
 * Radians per pixel of a horizontal drag
 */
const TURN_PER_PIXEL = 0.01
/**
 * Meters of the look target per pixel of a vertical drag, relative to the element height
 */
const LOOK_PER_HEIGHT = 1.5
/**
 * Zoom factor per wheel pixel (exponent)
 */
const ZOOM_PER_WHEEL = 0.0015

/**
 * Mouse and touch input of a {@link CharacterViewer} on its canvas, within the viewer's {@link CharacterViewer.viewLimits}:
 *
 * - horizontal drag: the character turns
 * - vertical drag: the framing moves between the knees and the head (look target and camera height), drag up looks down
 * - wheel, pinch: zoom
 * - double click: back to the stage's view
 */
export class CharacterControls {
  private readonly viewer: CharacterViewer
  private readonly element: HTMLElement
  private readonly pointers = new Map<number, { x: number; y: number }>()
  private pinchDistance = 0

  public constructor(viewer: CharacterViewer, element: HTMLElement) {
    this.viewer = viewer
    this.element = element
    element.style.touchAction = 'none'
    element.addEventListener('pointerdown', this.onPointerDown)
    element.addEventListener('pointermove', this.onPointerMove)
    element.addEventListener('pointerup', this.onPointerUp)
    element.addEventListener('pointercancel', this.onPointerUp)
    element.addEventListener('wheel', this.onWheel, { passive: false })
    element.addEventListener('dblclick', this.onDoubleClick)
  }

  public dispose() {
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.element.removeEventListener('pointermove', this.onPointerMove)
    this.element.removeEventListener('pointerup', this.onPointerUp)
    this.element.removeEventListener('pointercancel', this.onPointerUp)
    this.element.removeEventListener('wheel', this.onWheel)
    this.element.removeEventListener('dblclick', this.onDoubleClick)
    this.pointers.clear()
  }

  /**
   * Turns the character by an angle, positive turns its front to the right of the image. The camera stays.
   */
  public turn(angle: number) {
    this.viewer.characterRotation += angle
  }

  /**
   * Moves the look target up (positive) or down in meters, the camera height follows: from the lowest framing through
   * the stage's view to the highest
   */
  public raise(meters: number) {
    const view = this.viewer.view
    const limits = this.viewer.viewLimits
    const base = this.viewer.stageView
    view.look = Math.min(Math.max(view.look + meters, limits.look[0]), limits.look[1])
    if (view.look <= base.look) {
      view.height = lerp(limits.height[0], base.height, ratio(view.look, limits.look[0], base.look))
    } else {
      view.height = lerp(base.height, limits.height[1], ratio(view.look, base.look, limits.look[1]))
    }
  }

  /**
   * Multiplies the zoom, within the limits
   */
  public zoomBy(factor: number) {
    const view = this.viewer.view
    const [min, max] = this.viewer.viewLimits.zoom
    view.zoom = Math.min(Math.max(view.zoom * factor, min), max)
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }
    this.element.setPointerCapture(event.pointerId)
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    this.pinchDistance = this.pointerDistance()
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const last = this.pointers.get(event.pointerId)
    if (!last) {
      return
    }
    const dx = event.clientX - last.x
    const dy = event.clientY - last.y
    last.x = event.clientX
    last.y = event.clientY
    if (this.pointers.size === 1) {
      this.turn(dx * TURN_PER_PIXEL)
      this.raise((dy / Math.max(this.element.clientHeight, 1)) * LOOK_PER_HEIGHT)
      return
    }
    const distance = this.pointerDistance()
    if (this.pinchDistance > 0 && distance > 0) {
      this.zoomBy(distance / this.pinchDistance)
    }
    this.pinchDistance = distance
  }

  private readonly onPointerUp = (event: PointerEvent) => {
    this.pointers.delete(event.pointerId)
    this.pinchDistance = this.pointerDistance()
  }

  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault()
    this.zoomBy(Math.exp(-event.deltaY * ZOOM_PER_WHEEL))
  }

  private readonly onDoubleClick = () => {
    this.viewer.resetView()
  }

  /**
   * Distance of the first two pointers, 0 with fewer
   */
  private pointerDistance(): number {
    if (this.pointers.size < 2) {
      return 0
    }
    const [a, b] = this.pointers.values()
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function ratio(value: number, from: number, to: number): number {
  if (to === from) {
    return 0
  }
  return (value - from) / (to - from)
}
