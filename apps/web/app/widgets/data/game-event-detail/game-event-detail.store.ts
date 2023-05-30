import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { GameEvent } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { rejectKeys } from '~/utils'

@Injectable()
export class GameEventDetailStore extends ComponentStore<{ eventId: string }> {
  public readonly eventId$ = this.select(({ eventId }) => eventId)

  @Output()
  public readonly gameEvent$ = this.select(this.db.gameEvent(this.eventId$), (it) => it)

  public readonly properties$ = this.select(this.gameEvent$, selectProperties)

  public constructor(protected db: NwDbService) {
    super({ eventId: null })
  }

  public update(eventId: string) {
    this.patchState({ eventId: eventId })
  }
}

function selectProperties(item: GameEvent) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
