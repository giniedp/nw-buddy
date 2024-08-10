import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withState } from '@ngrx/signals'
import { GameEventData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { withNwData } from '~/data/with-nw-data'
import { rejectKeys } from '~/utils'
import { selectGameEventItemReward, selectGameEventRewards } from './selectors'
import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { NwDataService } from '~/data'
import { EMPTY, catchError, combineLatest, map, of, switchMap } from 'rxjs'

export interface GameEventDetailState {
  eventId: string
  gameEvent: GameEventData
  itemReward: MasterItemDefinitions | HouseItems
  isLoaded: boolean
}

export const GameEventDetailStore = signalStore(
  { protectedState: false },
  withState<GameEventDetailState>({
    eventId: null,
    gameEvent: null,
    isLoaded: false,
    itemReward: null,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ eventId: string }>(),
      },
      private: {
        loaded: payload<Omit<GameEventDetailState, 'isLoaded'>>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoaded: false,
        })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ eventId }) => loadState(db, eventId)),
          map((data) => actions.loaded(data)),
          catchError((error) => {
            console.error(error)
            return EMPTY
          }),
        ),
      }
    },
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
function loadState(db: NwDataService, eventId: string) {
  const gameEvent$ = db.gameEvent(eventId)
  const reward$ = gameEvent$.pipe(map((it) => selectGameEventItemReward(it)))
  const itemReward$ = db.itemOrHousingItem(reward$.pipe(map((it) => it?.itemId)))
  return combineLatest({
    eventId: of(eventId),
    gameEvent: gameEvent$,
    itemReward: itemReward$,
  })
}

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
