import { GameComponent, GameEntity } from '@nw-viewer/ecs'
import { SceneProvider } from '@nw-viewer/services/scene-provider'

export class ViewDistanceComponent implements GameComponent {
  public entity: GameEntity
  private maxViewDistance: number
  private scene: SceneProvider

  public constructor(maxViewDistance: number) {
    this.maxViewDistance = maxViewDistance
  }

  public initialize(entity: GameEntity): void {
    this.scene = entity.service(SceneProvider)
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }

  private update = () => {
    const cx = this.scene.main.activeCamera.position.x
    const cy = this.scene.main.activeCamera.position.y
  }
}
