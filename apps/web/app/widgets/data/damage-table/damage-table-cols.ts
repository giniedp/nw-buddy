import { NW_FALLBACK_ICON } from '@nw-data/common'
import { COLS_DAMAGEDATA, DamageData } from '@nw-data/generated'
import { damageTypeIcon } from '~/nw/weapon-types'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type DamageTableUtils = TableGridUtils<DamageTableRecord>
export type DamageTableRecord = DamageData & { $source: string }

export function damageColIcon(util: DamageTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    getQuickFilterText: () => '',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_DAMAGEDATA),
    }),
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elImg({
        class: ['w-8', 'h-8'],
        src: damageTypeIcon(data.DamageType) || NW_FALLBACK_ICON,
      })
    }),
  })
}
export function damageColID(util: DamageTableUtils) {
  return util.colDef<string>({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    field: 'DamageID',
    getQuickFilterText: ({ value }) => value,
  })
}
export function damageSource(util: DamageTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Source',
    width: 200,
    field: '$source' as any,
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function damageColDamageType(util: DamageTableUtils) {
  return util.colDef({
    colId: 'damageType',
    headerValueGetter: () => 'DamageType',
    field: 'DamageType',
    width: 200,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function damageColAttackType(util: DamageTableUtils) {
  return util.colDef({
    colId: 'attackType',
    headerValueGetter: () => 'AttackType',
    field: 'AttackType',
    width: 200,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function damageColDmgCoef(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoef',
    headerValueGetter: () => 'DmgCoef',
    field: 'DmgCoef',
    ...(util.precision as any),
  })
}

export function damageColDmgCoefCrit(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoefCrit',
    headerValueGetter: () => 'DmgCoefCrit',
    field: 'DmgCoefCrit',
    ...(util.precision as any),
  })
}

export function damageColDmgCoefHead(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoefHead',
    headerValueGetter: () => 'DmgCoefHead',
    field: 'DmgCoefHead',
    ...(util.precision as any),
  })
}

export function damageColCanCrit(util: DamageTableUtils) {
  return util.colDef({
    colId: 'canCrit',
    headerValueGetter: () => 'CanCrit',
    field: 'CanCrit',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function damageColCritHitStun(util: DamageTableUtils) {
  return util.colDef({
    colId: 'critHitStun',
    headerValueGetter: () => 'CritHitStun',
    field: 'CritHitStun',
  })
}

export function damageColCritPowerLevel(util: DamageTableUtils) {
  return util.colDef({
    colId: 'critPowerLevel',
    headerValueGetter: () => 'CritPowerLevel',
    field: 'CritPowerLevel',
  })
}

export function damageColAffixes(util: DamageTableUtils) {
  return util.colDef({
    colId: 'affixes',
    headerValueGetter: () => 'Affixes',
    field: 'Affixes',
    width: 200,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function damageColAffliction(util: DamageTableUtils) {
  return util.colDef({
    colId: 'affliction',
    headerValueGetter: () => 'Affliction',
    field: 'Affliction',
    width: 200,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
