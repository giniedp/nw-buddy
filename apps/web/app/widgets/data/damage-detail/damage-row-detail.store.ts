import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { AffixStatData, DamageData, StatusEffectData } from '@nw-data/generated'
import { combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { damageTypeIcon } from '~/nw/weapon-types'
import { combineLatestOrEmpty, rejectKeys, selectSignal } from '~/utils'

export interface DamageDetailState {
  row: DamageData
  affix: AffixStatData
  effects: StatusEffectData[]
}

export const DamageDetailStore = signalStore(
  withState<DamageDetailState>({
    row: null,
    affix: null,
    effects: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: { rowId: string }) => {
        const row$ = from(db.damageTablesById(data.rowId))
        const affix$ = row$.pipe(
          map((it) => it?.Affixes),
          switchMap((it) => (it ? db.affixStatsById(it) : of(null))),
        )
        const statusEffects$ = row$.pipe(
          map((it) => it?.StatusEffect || []),
          switchMap((ids) => combineLatestOrEmpty(ids.map((id) => db.statusEffectsById(id)))),
        )
        return combineLatest({
          row: row$,
          affix: affix$,
          effects: statusEffects$,
        })
      },
    }
  }),
  withComputed(({ row, affix }) => {
    return {
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
