import { Camera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { GameService, GameServiceContainer } from '../../ecs'
import { EventEmitter, GameLoop, Keyboard, Mouse } from '../core'

export class RendererProvider implements GameService {
  public readonly game: GameServiceContainer
  public readonly renderer: WebGLRenderer
  public readonly mouse = new Mouse()
  public readonly keyboard = new Keyboard()

  private loop = new GameLoop()
  private resizeNeeded = false
  private resize = new ResizeObserver(() => (this.resizeNeeded = true))
  private resizeElement: HTMLElement
  private events = new EventEmitter()

  public readonly onResize = this.events.createObserver<number, number>('resize')
  public get clientWidth() {
    return this.resizeElement.clientWidth
  }
  public get clientHeight() {
    return this.resizeElement.clientHeight
  }

  public get canvas() {
    return this.renderer.domElement
  }

  public get onUpdate() {
    return this.loop.onUpdate
  }

  public get onDraw() {
    return this.loop.onDraw
  }

  public get geometryCount() {
    return this.renderer.info.memory.geometries
  }

  public get textureCount() {
    return this.renderer.info.memory.textures
  }

  public get programCount() {
    return this.renderer.info.programs.length
  }

  public get renderCalls() {
    return this.renderer.info.render.calls
  }

  public get renderFrame() {
    return this.renderer.info.render.frame
  }

  public get updateTime() {
    return this.loop.updateTime
  }

  public get drawTime() {
    return this.loop.drawTime
  }

  public get frameTime() {
    return this.loop.frameTime
  }

  public get isSlow() {
    return this.loop.isRunningSlowly
  }

  public constructor(renderer: WebGLRenderer, resizeElement?: HTMLElement) {
    this.renderer = renderer
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.resizeElement = resizeElement || renderer.domElement.parentElement
    this.mouse.listener.setup({ captureTarget: this.renderer.domElement })
    // this.keyboard = new Keyboard({ eventTarget: this.renderer.domElement })

  }

  public initialize(game: GameServiceContainer): void {
    Object.assign(this, { game })

    this.resize.observe(this.resizeElement)
    this.loop.onUpdate.add(this.handleUpdate)
    this.loop.start()
  }

  public destroy(): void {
    this.loop.stop()
    this.loop.onUpdate.remove(this.handleUpdate)
    this.resize.disconnect()
    this.renderer.dispose()
  }

  public render(scene: Scene, camera: Camera) {
    this.renderer.render(scene, camera)
  }

  private handleUpdate = () => {
    this.keyboard.update()
    this.mouse.update()
    if (this.resizeNeeded) {
      this.resizeNeeded = false
      const width = this.resizeElement.clientWidth
      const height = this.resizeElement.clientHeight
      this.renderer.setSize(width, height)
      this.onResize.trigger(width, height)
    }
  }

}
