import { Camera, PerspectiveCamera } from 'three'
import { GameComponent, GameEntity } from '../../ecs'
import { RendererProvider } from '../services/renderer-provider'
import { TransformComponent } from './transform-component'

export class CameraComponent implements GameComponent {
  public entity: GameEntity
  public camera: Camera
  private parent: TransformComponent
  private three: RendererProvider
  public constructor(camera?: Camera) {
    this.camera = camera || new PerspectiveCamera()
  }

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.three = entity.game.get(RendererProvider)
    this.parent = entity.component(TransformComponent, true)
    if (this.parent && this.parent.node !== this.camera) {
      this.parent.node.add(this.camera)
    }
  }

  public activate(): void {
    this.three.onUpdate.add(this.onFrame)
  }

  public deactivate(): void {
    this.three.onUpdate.remove(this.onFrame)
  }

  public destroy(): void {
    //
  }

  private onFrame = () => {
    const pCam = this.camera as PerspectiveCamera
    pCam.aspect = this.three.clientWidth / this.three.clientHeight
    pCam.updateProjectionMatrix()
  }
}
