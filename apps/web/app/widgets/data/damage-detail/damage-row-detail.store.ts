import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { inject } from '@angular/core'
import { patchState, signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { AffixStatData, DamageData, StatusEffectData } from '@nw-data/generated'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { damageTypeIcon } from '~/nw/weapon-types'
import { combineLatestOrEmpty, rejectKeys, selectSignal } from '~/utils'

export interface DamageDetailState {
  row: DamageData
  affix: AffixStatData
  effects: StatusEffectData[]
  isLoaded: boolean
}

export const DamageDetailStore = signalStore(
  withState<DamageDetailState>({
    row: null,
    affix: null,
    effects: [],
    isLoaded: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ rowId: string }>(),
      },
      private: {
        loaded: payload<{
          row: DamageData
          affix: AffixStatData
          effects: StatusEffectData[]
        }>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state, { rowId }) => {
        patchState(state, {
          isLoaded: false,
        })
      })
      on(actions.loaded, (state, { row, affix, effects }) => {
        patchState(state, {
          row: row,
          affix: affix,
          effects: effects,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ rowId }) => {
            const row$ = db.damageTable(rowId)
            const affix$ = row$.pipe(
              map((it) => it?.Affixes),
              switchMap((it) => (it ? db.affixStat(it) : of(null))),
            )
            const statusEffects$ = row$.pipe(
              map((it) => it?.StatusEffect || []),
              switchMap((ids) => combineLatestOrEmpty(ids.map((id) => db.statusEffect(id)))),
            )

            return combineLatest({
              row: row$,
              affix: affix$,
              effects: statusEffects$,
            })
          }),
          map((data) => actions.loaded(data)),
        ),
      }
    },
  }),
  withComputed(({ isLoaded, row, affix }) => {
    return {
      isLoading: selectSignal(isLoaded, (it) => !it),
      properties: selectSignal(row, selectProperties),
      affixProps: selectSignal(affix, selectAffixProperties),
      effectIds: selectSignal(row, (it) => it?.StatusEffect),
      icon: selectSignal(row, (it) => damageTypeIcon(it?.DamageType, NW_FALLBACK_ICON)),
    }
  }),
)

function selectProperties(item: DamageData) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectAffixProperties(item: AffixStatData) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
