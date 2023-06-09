import { Injectable, Output } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { GameEvent } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { rejectKeys } from '~/utils'
import { selectGameEventRewards } from './selectors'

@Injectable()
export class GameEventDetailStore extends ComponentStore<{ eventId: string }> {
  public readonly eventId$ = this.select(({ eventId }) => eventId)

  @Output()
  public readonly gameEvent$ = this.select(this.db.gameEvent(this.eventId$), (it) => it)

  public readonly properties$ = this.select(this.gameEvent$, selectProperties)
  public readonly itemRewardId$ = this.select(this.gameEvent$, (it) => it?.ItemReward)
  public readonly itemReward$ = this.select(this.db.itemOrHousingItem(this.itemRewardId$), (it) => it)
  public readonly rewards$ = this.select(this.gameEvent$, this.itemReward$, selectGameEventRewards)

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
