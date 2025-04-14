import {
  AbstractEngine,
  ArcRotateCamera,
  Camera,
  FlyCamera,
  FreeCamera,
  ImageProcessingConfiguration,
  Mesh,
  Scene,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import { Inspector } from '@babylonjs/inspector'
import { defer } from 'rxjs'
import { GameHost, GameSystem } from '../ecs'
import { createScreenQuad, createScreenQuadCamera } from '../graphics'
import { fromBObservable } from '../utils'
import { EngineProvider } from './engine-provider'
import { ObservablesKeysOf, ObservableValue } from './types'

export class SceneProvider implements GameSystem {
  public game: GameHost
  public main: Scene
  public engine: AbstractEngine

  public arcRotateCamera: ArcRotateCamera
  public freeCamera: FreeCamera
  public flyCamera: FlyCamera
  public screenQuadCamera: Camera
  public screenQuad: VertexData
  public screenQuadMesh: Mesh

  public initialize(game: GameHost) {
    this.game = game
    this.engine = game.system(EngineProvider).engine
    if (!this.main) {
      const scene = createScene(this.engine)
      this.main = scene
      this.arcRotateCamera = new ArcRotateCamera('ArcRotateCamera', 0, 0, 10, Vector3.Zero(), this.main)
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

      this.freeCamera.attachControl(true)
      this.freeCamera.keysUp = [87] // W
      this.freeCamera.keysDown = [83] // S
      this.freeCamera.keysLeft = [65] // A
      this.freeCamera.keysRight = [68] // D

      this.main.activeCamera = this.arcRotateCamera
    }
    this.engine.runRenderLoop(this.onRenderLoot)
  }

  private onRenderLoot = () => {
    this.main.render()
  }

  public destroy(): void {
    this.engine.stopRenderLoop(this.onRenderLoot)
    this.main.dispose()
    this.main = null
  }

  public event<K extends ObservablesKeysOf<Scene>>(event: K) {
    return defer(() => fromBObservable<ObservableValue<K, Scene>>(this.main[event]))
  }

  public showInspector() {
    Inspector.Show(this.main, { embedMode: true })
  }

  public onMeshesUpdated() {
    // this.main.createOrUpdateSelectionOctree(64, 8)
  }
}

function createScene(engine: AbstractEngine) {
  const scene = new Scene(engine)
  scene.clearColor.set(0, 0, 0, 1)
  scene.autoClear = true
  scene.imageProcessingConfiguration.toneMappingEnabled = true
  scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL
  scene.imageProcessingConfiguration.exposure = 1.0
  scene.imageProcessingConfiguration.contrast = 1.0
  return scene
}
