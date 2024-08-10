import { Directive, inject, Input } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { GameEventDetailStore } from './game-event-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbGameEventDetail]',
  exportAs: 'eventDetail',
  providers: [GameEventDetailStore],
})
export class GameEventDetailDirective {
  public readonly store = inject(GameEventDetailStore)
  @Input()
  public set nwbGameEventDetail(value: string) {
    this.store.load({ eventId: value })
  }
}
