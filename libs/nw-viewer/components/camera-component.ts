import { ArcRotateCamera, FlyCamera, FreeCamera, Scene, Vector3 } from '@babylonjs/core'
import { Subject } from 'rxjs'
import { GameComponent, GameEntity } from '../ecs'
import { SceneProvider } from '../services/scene-provider'

export class CameraComponent implements GameComponent {
  #disable$ = new Subject<void>()
  private camera: ArcRotateCamera
  private freeCamera: FreeCamera
  private flyCam: FlyCamera
  private scene: Scene

  public entity: GameEntity

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.scene = entity.system(SceneProvider).main
  }

  public activate(): void {
    const position = new Vector3(9535, 1024, 9330)
    this.freeCamera = new FreeCamera('FreeCamera', position.clone(), this.scene)
    this.flyCam = new FlyCamera('FlyCamera', position.clone(), this.scene)

    this.camera = new ArcRotateCamera('Camera', 0, 0, 10, Vector3.Zero(), this.scene)
    const camera = this.camera

    camera.setTarget(new Vector3(7168, 2, 7168))
    camera.setPosition(new Vector3(7168, 2, 7178))
    camera.minZ = 0.01
    camera.lowerRadiusLimit = 1
    camera.upperRadiusLimit = 1000
    camera.wheelPrecision = 20

    this.freeCamera.attachControl(true)
    this.freeCamera.keysUp = [87] // W
    this.freeCamera.keysDown = [83] // S
    this.freeCamera.keysLeft = [65] // A
    this.freeCamera.keysRight = [68] // D

    this.scene.activeCamera = this.freeCamera
  }

  public deactivate(): void {
    this.#disable$.next()
    this.camera.detachControl()
    this.camera.dispose()
    this.camera = null
  }

  public destroy(): void {

  }

}
