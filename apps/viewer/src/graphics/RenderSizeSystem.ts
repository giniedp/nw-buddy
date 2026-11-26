import { EcsGame } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import type { IRect } from '@gglib/math'
import { ViewerConfig } from '../config'

/**
 * Sets the render size of the device and the main view, from the config (renderResolution, renderScaling,
 * renderScale)
 *
 * @remarks
 * Replaces the autosize of the device. It observes the element that contains the canvas:
 * - `window`: the canvas fills the container in device pixels, the main view renders at `renderScale` of it and is
 *   upscaled to the canvas
 * - fixed size + `fit`: the canvas fills the container, the main view is letterboxed into it (viewport) with the
 *   aspect ratio of the resolution and renders at the resolution, scaled to the viewport
 * - fixed size + `none`: the canvas has the resolution, one render pixel per device pixel, centered and cropped if
 *   larger than the container
 */
export class RenderSizeSystem extends GameSystem {
  private device: Device
  private config: ViewerConfig
  private game: EcsGame
  private canvas: HTMLCanvasElement | null = null
  private observer: ResizeObserver | null = null
  private unsubscribe: Array<() => void> = []

  /**
   * Size of the canvas container in CSS pixels and device pixels
   */
  private container = { cssWidth: 0, cssHeight: 0, width: 0, height: 0 }

  /**
   * The viewport of the main view in normalized canvas coordinates (0-1), letterboxed for a fixed resolution + fit
   */
  public readonly viewport: IRect = { x: 0, y: 0, width: 1, height: 1 }

  /**
   * Render scale of the main view, relative to its viewport in canvas pixels
   */
  public renderScale = 1

  /**
   * Aspect ratio of the main view, for the camera
   */
  public get aspectRatio(): number {
    const output = this.device.output
    return (output.width * this.viewport.width) / (output.height * this.viewport.height)
  }

  public initialize(world: GameWorld): void {
    this.device = world.getSystem(Device)
    this.config = world.getSystem(ViewerConfig)
    this.game = world.getSystem(EcsGame)
    const canvas = this.device.canvas
    if (!(canvas instanceof HTMLCanvasElement) || !canvas.parentElement) {
      return
    }
    this.canvas = canvas
    this.observer = new ResizeObserver(this.handleResize)
    this.observeContainer()
    this.unsubscribe.push(this.config.onChange('renderResolution', this.apply))
    this.unsubscribe.push(this.config.onChange('renderScaling', this.apply))
    this.unsubscribe.push(this.config.onChange('renderScale', this.apply))
    // the device sizes the output from the canvas once it is ready, apply the config again after that
    this.device.ready.then(this.apply)
  }

  /**
   * Observes the current parent of the canvas. Call it after the canvas was moved into another
   * element, the render size follows the new container from then on.
   */
  public observeContainer() {
    const container = this.canvas?.parentElement
    if (!this.observer || !container) {
      return
    }
    this.observer.disconnect()
    // reports the current size right away, which applies it
    this.observer.observe(container)
  }

  public destroy(): void {
    this.observer?.disconnect()
    this.observer = null
    this.unsubscribe.forEach((off) => off())
    this.unsubscribe.length = 0
  }

  /**
   * Maps a normalized canvas position (0-1) into the main view (0-1), e.g. the mouse for picking
   */
  public toViewX(x: number): number {
    return (x - this.viewport.x) / this.viewport.width
  }

  /**
   * Maps a normalized canvas position (0-1) into the main view (0-1), e.g. the mouse for picking
   */
  public toViewY(y: number): number {
    return (y - this.viewport.y) / this.viewport.height
  }

  private handleResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    const container = this.container
    container.cssWidth = entry.contentRect.width
    container.cssHeight = entry.contentRect.height
    const devicePixels = entry.devicePixelContentBoxSize?.[0]
    container.width = devicePixels ? devicePixels.inlineSize : Math.round(container.cssWidth * devicePixelRatio)
    container.height = devicePixels ? devicePixels.blockSize : Math.round(container.cssHeight * devicePixelRatio)
    this.apply()
  }

  private apply = () => {
    const container = this.container
    const canvas = this.canvas
    if (!canvas || !container.width || !container.height) {
      return
    }
    const viewport = this.viewport
    viewport.x = viewport.y = 0
    viewport.width = viewport.height = 1
    this.renderScale = 1

    const resolution = parseResolution(this.config.value.renderResolution)
    if (resolution && this.config.value.renderScaling === 'none') {
      this.device.resize(resolution.width, resolution.height)
      // CSS size for one render pixel per device pixel
      const devicePixelsPerCss = container.width / container.cssWidth
      Object.assign(canvas.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${resolution.width / devicePixelsPerCss}px`,
        height: `${resolution.height / devicePixelsPerCss}px`,
        transform: 'translate(-50%, -50%)',
      })
      this.updateView()
      return
    }

    // the canvas fills the container
    resetCanvasStyle(canvas)
    this.device.resize(container.width, container.height)
    if (resolution) {
      // fit: letterbox the resolution into the canvas, render at the resolution
      const fit = Math.min(container.width / resolution.width, container.height / resolution.height)
      const width = resolution.width * fit
      const height = resolution.height * fit
      viewport.width = width / container.width
      viewport.height = height / container.height
      viewport.x = (1 - viewport.width) / 2
      viewport.y = (1 - viewport.height) / 2
      this.renderScale = 1 / fit
    } else {
      this.renderScale = parseRenderScale(this.config.value.renderScale)
    }
    this.updateView()
  }

  private updateView() {
    const view = this.game.scene?.getView(0)
    if (!view) {
      return
    }
    view.viewport = this.viewport
    view.renderScale = this.renderScale
  }
}

/**
 * Parses a resolution like `1920x1080`, null for `window`
 */
function parseResolution(value: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(value)
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

/**
 * The render scale of a preset: `native` is 1, a percentage like `67%` is the FSR ratio it names (1 / 1.5)
 */
function parseRenderScale(value: string): number {
  switch (value) {
    case '77%':
      return 1 / 1.3
    case '67%':
      return 1 / 1.5
    case '59%':
      return 1 / 1.7
    case '50%':
      return 1 / 2
    default:
      return 1
  }
}

/**
 * The canvas fills its container. Set inline, so hosts that embed the viewer need no stylesheet for it.
 */
function resetCanvasStyle(canvas: HTMLCanvasElement) {
  Object.assign(canvas.style, {
    display: 'block',
    position: '',
    left: '',
    top: '',
    width: '100%',
    height: '100%',
    transform: '',
  })
}
