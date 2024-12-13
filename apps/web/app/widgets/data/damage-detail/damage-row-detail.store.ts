import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { AffixStatData, DamageData, StatusEffectData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { damageTypeIcon } from '~/nw/weapon-types'
import { rejectKeys, selectSignal } from '~/utils'

export interface DamageDetailState {
  table: string
  rowId: string
  row: DamageData
  affix: AffixStatData
  effects: StatusEffectData[]
}

export const DamageDetailStore = signalStore(
  withState<DamageDetailState>({
    table: null,
    rowId: null,
    row: null,
    affix: null,
    effects: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async (data: { table: string; rowId: string }) => {
        const row = await db.damageTablesBySourceAndRowId(data.table, data.rowId)
        const affix = !row?.Affixes ? null : await db.affixStatsById(row.Affixes)
        const effects = !row?.StatusEffect
          ? []
          : await Promise.all(row.StatusEffect.map((it) => db.statusEffectsById(it)))

        return {
          table: data.table,
          rowId: data.rowId,
          row,
          affix,
          effects,
        }
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
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
}

function selectAffixProperties(item: AffixStatData) {
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
}
