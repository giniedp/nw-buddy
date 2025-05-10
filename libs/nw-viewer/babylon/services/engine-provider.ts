import { AbstractEngine } from '@babylonjs/core'
import { GameService, GameServiceContainer } from '../../ecs'

export class EngineProvider implements GameService {
  public game: GameServiceContainer
  public engine: AbstractEngine

  private resizeNeeded = false
  private resize = new ResizeObserver(() => {
    this.resizeNeeded = true
  })

  public constructor(engine: AbstractEngine) {
    this.engine = engine
  }

  public initialize(game: GameServiceContainer): void {
    this.game = game
    this.resize.observe(this.engine.getRenderingCanvas())
    this.engine.onBeginFrameObservable.add(this.onBeginFrame)
  }

  public destroy(): void {
    this.resize.disconnect()
    this.engine.onBeginFrameObservable.removeCallback(this.onBeginFrame)
  }

  private onBeginFrame = () => {
    if (this.resizeNeeded) {
      this.resizeNeeded = false
      this.engine.resize()
    }
  }
}
