import { computed } from '@angular/core'
import { signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { GameEventData } from '@nw-data/generated'
import { withNwData } from '~/data/with-nw-data'
import { rejectKeys } from '~/utils'
import { selectGameEventItemReward, selectGameEventRewards } from './selectors'

export interface GameEventDetailState {
  eventId: string
}

export const GameEventDetailStore = signalStore(
  { protectedState: false },
  withState<GameEventDetailState>({ eventId: null }),
  withNwData((db) => {
    return {
      itemsMap: db.itemsMap,
      housingMap: db.housingItemsMap,
      eventsMap: db.gameEventsMap,
    }
  }),
  withHooks({
    onInit: (state) => state.loadNwData(),
  }),
  withComputed(({ eventId, nwData }) => {
    const gameEvent = computed(() => nwData().eventsMap?.get(eventId()))
    const reward = computed(() => selectGameEventItemReward(gameEvent()))
    const itemReward = computed(() => {
      const it = reward()
      const item = nwData().itemsMap?.get(it?.itemId)
      const houstinItem = nwData().housingMap?.get(it?.housingItemId)
      return item || houstinItem
    })
    const lootTableId = computed(() => reward()?.lootTableId)
    const rewards = computed(() => selectGameEventRewards(gameEvent(), itemReward()))
    const properties = computed(() => selectProperties(gameEvent()))
    return {
      gameEvent,
      itemReward,
      lootTableId,
      properties,
      rewards,
    }
  }),
)

// extends ComponentStore<{ eventId: string }> {
//   public readonly eventId$ = this.select(({ eventId }) => eventId)

//   public readonly gameEvent$ = this.select(this.db.gameEvent(this.eventId$), (it) => it)

//   public readonly properties$ = this.select(this.gameEvent$, selectProperties)
//   public readonly lootTableId$ = this.select(this.gameEvent$, (it) => selectGameEventItemReward(it)?.lootTableId)
//   public readonly itemId$ = this.select(this.gameEvent$, (it) => {
//     const reward = selectGameEventItemReward(it)
//     return reward?.itemId || reward?.housingItemId
//   })

//   public readonly itemReward$ = selectStream(this.db.itemOrHousingItem(this.itemId$))
//   public readonly rewards$ = selectStream(
//     {
//       gameEvent: this.gameEvent$,
//       itemReward: this.itemReward$,
//     },
//     ({ gameEvent, itemReward }) => selectGameEventRewards(gameEvent, itemReward),
//   )

//   public constructor(protected db: NwDataService) {
//     super({ eventId: null })
//   }

//   public update(eventId: string) {
//     this.patchState({ eventId: eventId })
//   }
// }

function selectProperties(item: GameEventData) {
  const reject: Array<keyof GameEventData> = [
    '$source' as any,
    'AzothReward',
    'AzothSalt',
    'CurrencyReward',
    'FactionInfluenceAmount',
    'FactionReputation',
    'FactionTokens',
    'SeasonsXp',
    'TerritoryStanding',
    'UniversalExpAmount',
    'PVPXP',
    'PvpXp',
  ]
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
