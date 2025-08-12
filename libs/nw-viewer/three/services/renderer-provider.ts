import { Camera, HalfFloatType, NoToneMapping, Scene, WebGLRenderer } from 'three'
import { GameService, GameServiceContainer } from '../../ecs'
import { EventEmitter, GameLoop, Keyboard, Mouse } from '../core'

import {
  BlendFunction,
  BloomEffect,
  DepthDownsamplingPass,
  EffectComposer,
  EffectPass,
  NormalPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  SSAOEffect,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing'
import { DDSTextureLoader } from '../graphics/dds-loader'

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

  private composer: EffectComposer
  private composerInitialized = false
  private composerEnabled = true

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
    DDSTextureLoader.injectFormats(renderer)
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
    this.ensureComposer(scene, camera)
    if (this.composer) {
      this.composer.render()
    } else {
      this.renderer.render(scene, camera)
    }
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

      if (this.composer) {
        this.composer.setSize(width, height)
      }
    }
  }

  private ensureComposer(scene: Scene, camera: Camera) {
    if (!this.composerEnabled || this.composer || this.composerInitialized) {
      return
    }
    this.renderer.toneMapping = NoToneMapping
    this.composerInitialized = true
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: HalfFloatType,
    })
    this.composer.addPass(new RenderPass(scene, camera))

    // const n8aoPass = new N8AOPostPass(scene, camera, this.clientWidth, this.clientHeight)
    // n8aoPass.configuration.aoRadius = 0.5
    // n8aoPass.configuration.distanceFalloff = 2.0
    // n8aoPass.configuration.intensity = 2.0
    // n8aoPass.configuration.color = new Color(0, 0, 0)
    // n8aoPass.configuration.gammaCorrection = false
    // n8aoPass.setDisplayMode("Split AO")
    // n8aoPass.setDisplayMode('Split')
    // n8aoPass.setDisplayMode('Combined')

    const bloomEffect = new BloomEffect({
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.75,
      intensity: 0.15,
      mipmapBlur: true,
    })

    const smaa = new SMAAEffect({
      preset: SMAAPreset.ULTRA,
    })

    const normalPass = new NormalPass(scene, camera)
    const depthDownsamplingPass = new DepthDownsamplingPass({
      normalBuffer: normalPass.texture,
      resolutionScale: 1,
    })

    const ssaoEffect = new SSAOEffect(camera, normalPass.texture, {
      blendFunction: BlendFunction.MULTIPLY,
      distanceScaling: false,
      depthAwareUpsampling: true,
      normalDepthBuffer: depthDownsamplingPass.texture,
      samples: 32,

      rings: 7,
      distanceThreshold: 0.25,
      distanceFalloff: 0.25,
      rangeThreshold: 0.000001,
      rangeFalloff: 0,
      luminanceInfluence: 0,
      minRadiusScale: 1,
      radius: 0.03,
      intensity: 1.5,
      bias: 0.001,
      fade: 0.002,
      color: null,
      resolutionScale: 1,
    })

    const tonemapping = new ToneMappingEffect({
      mode: ToneMappingMode.NEUTRAL,
      resolution: 256,
      whitePoint: 16.0,
      middleGrey: 0.6,
      minLuminance: 0.01,
      averageLuminance: 0.01,
      adaptationRate: 1.0,
    })

    this.composer.addPass(normalPass)
    this.composer.addPass(depthDownsamplingPass)
    this.composer.addPass(
      new EffectPass(
        camera,
        ...[
          smaa,
          ssaoEffect,
          tonemapping,
          //bloomEffect,
        ],
      ),
    )
  }
}
