import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { GameEvent } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { rejectKeys, selectStream } from '~/utils'
import { selectGameEventItemReward, selectGameEventRewards } from './selectors'

@Injectable()
export class GameEventDetailStore extends ComponentStore<{ eventId: string }> {
  public readonly eventId$ = this.select(({ eventId }) => eventId)

  public readonly gameEvent$ = this.select(this.db.gameEvent(this.eventId$), (it) => it)

  public readonly properties$ = this.select(this.gameEvent$, selectProperties)
  public readonly lootTableId$ = this.select(this.gameEvent$, (it) => selectGameEventItemReward(it)?.lootTableId)
  public readonly itemId$ = this.select(this.gameEvent$, (it) => {
    const reward = selectGameEventItemReward(it)
    return reward?.itemId || reward?.housingItemId
  })

  public readonly itemReward$ = selectStream(this.db.itemOrHousingItem(this.itemId$))
  public readonly rewards$ = selectStream(
    {
      gameEvent: this.gameEvent$,
      itemReward: this.itemReward$,
    },
    ({ gameEvent, itemReward }) => selectGameEventRewards(gameEvent, itemReward),
  )

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
