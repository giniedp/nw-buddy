import { AbstractEngine, Engine } from '@babylonjs/core'
import { defer } from 'rxjs'
import { GameHost, GameSystem } from '../ecs'
import { fromBObservable } from '../utils'
import { ObservablesKeysOf, ObservableValue } from './types'

export class EngineProvider implements GameSystem {
  public game: GameHost
  public engine: AbstractEngine

  public viewDistance = 800
  private resizeNeeded = false
  private resize = new ResizeObserver(() => {
    this.resizeNeeded = true
  })

  public constructor(engine: AbstractEngine) {
    this.engine = engine
  }

  public initialize(game: GameHost): void {
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

  public event<K extends ObservablesKeysOf<AbstractEngine>>(event: K) {
    return defer(() => fromBObservable<ObservableValue<K, AbstractEngine>>(this.engine[event]))
  }

}
