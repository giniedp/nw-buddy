import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GameComponent, GameEntity } from '../../ecs'
import { RendererProvider } from '../services/renderer-provider'
import { CameraComponent } from './camera-component'

export class OrbitComponent implements GameComponent {
  private orbit: OrbitControls
  private renderer: RendererProvider
  private parent: CameraComponent
  public entity: GameEntity

  public initialize(entity: GameEntity): void {
    this.entity = entity
    this.renderer = entity.service(RendererProvider)
    this.parent = entity.component(CameraComponent)
  }

  public activate(): void {
    this.orbit = new OrbitControls(this.parent.camera, this.renderer.canvas)
    this.renderer.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.renderer.onUpdate.remove(this.update)
    this.orbit.dispose()
    this.orbit = null
  }

  public destroy(): void {
    //
  }

  private update = () => {
    if (this.orbit) {
      this.orbit.update()
    }
  }
}
