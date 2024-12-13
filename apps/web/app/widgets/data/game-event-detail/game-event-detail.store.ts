import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { GameEventData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { combineLatest, from, map, of, switchMap } from 'rxjs'
import { NwDataBase } from '~/data'
import { rejectKeys } from '~/utils'
import { selectGameEventItemReward, selectGameEventRewards } from './selectors'

import { Observable } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'

export interface GameEventDetailState {
  eventId: string
  gameEvent: GameEventData
  itemReward: MasterItemDefinitions | HouseItems
}

export const GameEventDetailStore = signalStore(
  withState<GameEventDetailState>({
    eventId: null,
    gameEvent: null,
    itemReward: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: Pick<GameEventDetailState, 'eventId'>): Observable<GameEventDetailState> => {
        return loadState(db, data.eventId)
      },
    }
  }),
  withComputed(({ gameEvent, itemReward }) => {
    const reward = computed(() => selectGameEventItemReward(gameEvent()))
    const lootTableId = computed(() => reward()?.lootTableId)
    const rewards = computed(() => selectGameEventRewards(gameEvent(), itemReward()))
    const properties = computed(() => selectProperties(gameEvent()))
    return {
      lootTableId,
      properties,
      rewards,
    }
  }),
)

function loadState(db: NwDataBase, eventId: string) {
  const gameEvent$ = from(db.gameEventsById(eventId))
  const reward$ = gameEvent$.pipe(map(selectGameEventItemReward))
  const itemReward$ = reward$.pipe(switchMap((it) => db.itemOrHousingItem(it?.itemId))).pipe()
  return combineLatest({
    eventId: of(eventId),
    gameEvent: gameEvent$,
    itemReward: itemReward$,
  })
}

function selectProperties(item: GameEventData) {
  const reject: Array<keyof GameEventData> = [
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
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
