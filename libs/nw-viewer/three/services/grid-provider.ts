import { Box3 } from 'three'
import { GameService, GameServiceContainer } from '../../ecs'
import { EventEmitter } from '../core'

export class GridProvider implements GameService {
  private events = new EventEmitter()
  public parent: GridProvider
  public game: GameServiceContainer
  public onBoxAdded = this.events.createObserver<Box3>('boxAdded')

  public initialize(host: GameServiceContainer): void {
    this.game = host
    this.parent = host.get(GridProvider, {
      skipSelf: true,
      optional: true,
    })
  }

  public destroy(): void {
    //
  }

  public notifyBoxAdded(box: Box3): void {
    this.onBoxAdded.trigger(box)
    if (this.parent) {
      this.parent.notifyBoxAdded(box)
    }
  }
}
