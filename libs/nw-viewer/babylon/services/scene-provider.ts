import {
  AbstractEngine,
  ArcRotateCamera,
  Camera,
  Color3,
  FlyCamera,
  FreeCamera,
  GlowLayer,
  HighlightLayer,
  ImageProcessingConfiguration,
  InstancedMesh,
  Mesh,
  Node,
  PointerEventTypes,
  PointerInfo,
  Scene,
  SSAO2RenderingPipeline,
  TAARenderingPipeline,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import { Inspector } from '@babylonjs/inspector'
import { defer } from 'rxjs'
import { GameService, GameServiceContainer } from '../../ecs'
import { fromBObservable } from '../utils'
import { createScreenQuad, createScreenQuadCamera } from '../utils/fullscreen-quad'
import { EngineProvider } from './engine-provider'
import { ObservablesKeysOf, ObservableValue } from './types'

export class SceneProvider implements GameService {
  public game: GameServiceContainer
  public main: Scene
  public engine: AbstractEngine
  private ssao: SSAO2RenderingPipeline
  private taa: TAARenderingPipeline
  private glow: GlowLayer

  public arcRotateCamera: ArcRotateCamera
  public freeCamera: FreeCamera
  public flyCamera: FlyCamera
  public screenQuadCamera: Camera
  public screenQuad: VertexData
  public screenQuadMesh: Mesh
  public highlight: HighlightLayer

  public initialize(game: GameServiceContainer) {
    this.game = game
    this.engine = game.get(EngineProvider).engine

    this.main = createScene(this.engine)
    this.highlight = new HighlightLayer('highlight', this.main)
    this.highlight.blurHorizontalSize = 2
    this.highlight.blurVerticalSize = 2
    this.highlight.innerGlow = false

    this.arcRotateCamera = new ArcRotateCamera(
      'ArcRotateCamera',
      Math.PI / 3,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      this.main,
    )
    this.freeCamera = new FreeCamera('FreeCamera', Vector3.Zero(), this.main)
    this.flyCamera = new FlyCamera('FlyCamera', Vector3.Zero(), this.main)

    this.screenQuadCamera = createScreenQuadCamera(this.main)
    this.screenQuad = createScreenQuad(this.main)
    this.screenQuadMesh = new Mesh('ScreenQuad', this.main)
    this.screenQuadMesh.setEnabled(false)
    this.screenQuad.applyToMesh(this.screenQuadMesh, true)

    this.arcRotateCamera.minZ = 0.01
    this.arcRotateCamera.lowerRadiusLimit = 1
    this.arcRotateCamera.upperRadiusLimit = 1000
    this.arcRotateCamera.wheelPrecision = 20

    this.freeCamera.keysUp = [87] // W
    this.freeCamera.keysDown = [83] // S
    this.freeCamera.keysLeft = [65] // A
    this.freeCamera.keysRight = [68] // D

    this.main.activeCamera = this.arcRotateCamera
    this.ssao = new SSAO2RenderingPipeline('ssao', this.main, 1, [this.freeCamera])
    this.ssao.samples = 16
    this.taa = new TAARenderingPipeline('taa', this.main, [this.freeCamera])
    this.main.prePassRenderer.samples = 16
    // this.glow = new GlowLayer("glow", this.main, {
    //   mainTextureFixedSize: 512,
    //   blurKernelSize: 64,
    // })

    //this.main.performancePriority = ScenePerformancePriority.Aggressive
    this.engine.runRenderLoop(this.onRenderLoop)

    this.main.onPointerObservable.add(this.onPointerObservable)
    console.log('SceneProvider initialized')
  }

  private onRenderLoop = () => {
    this.main.render()
  }

  private onPointerObservable = (pointer: PointerInfo) => {
    this.handleMeshPicking(pointer)
  }

  public destroy(): void {
    this.engine.stopRenderLoop(this.onRenderLoop)
    this.main.dispose()
    this.main = null
    this.ssao?.dispose()
    this.ssao = null
    this.taa?.dispose()
    this.taa = null
  }

  public event<K extends ObservablesKeysOf<Scene>>(event: K) {
    return defer(() => fromBObservable<ObservableValue<K, Scene>>(this.main[event]))
  }

  public showInspector() {
    Inspector.Show(this.main, { embedMode: true })
  }

  private handleMeshPicking(pointer: PointerInfo) {
    if (!(pointer.type & PointerEventTypes.POINTERDOUBLETAP)) {
      return
    }
    this.highlight.removeAllMeshes()
    const info = this.main.pick(pointer.event.offsetX, pointer.event.offsetY)

    let mesh: Mesh
    let node: Node
    if (info.pickedMesh instanceof Mesh) {
      mesh = info.pickedMesh
      node = mesh
    } else if (info.pickedMesh instanceof InstancedMesh) {
      mesh = info.pickedMesh.sourceMesh
      node = info.pickedMesh.parent
    } else {
      console.log('unhandled pick', info)
    }
    if (mesh) {
      this.highlight.addMesh(mesh, new Color3(1, 0, 1), false)
      console.log('picked', {
        mesh,
        node,
      })
      logNameChain(node)
    }
  }
}

function logNameChain(node: Node) {
  if (!node) {
    return
  }
  console.log(node.name)
  logNameChain(node.parent)
}

function createScene(engine: AbstractEngine) {
  const scene = new Scene(engine)
  scene.clearColor.set(0, 0, 0, 1)
  scene.autoClear = true
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL
  scene.imageProcessingConfiguration.exposure = 1.0
  scene.imageProcessingConfiguration.contrast = 1.0

  let camera: Camera
  scene.onActiveCameraChanged.add(() => {
    if (scene.activeCamera?.name === 'ScreenQuadCamera' || camera === scene.activeCamera) {
      // WTF: why babylon switches scene camera when that camera is rendering something else aside from the scene (a render target)
      return
    }

    camera?.detachControl()
    camera = scene.activeCamera
    setTimeout(() => camera?.attachControl(true))
  })
  return scene
}
