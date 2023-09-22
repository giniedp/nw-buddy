import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Damagetable } from '@nw-data/generated'
import { damageTypeIcon } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'

export type DamageTableUtils = TableGridUtils<DamageTableRecord>
export type DamageTableRecord = Damagetable

export function damageColIcon(util: DamageTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
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
  //
  return util.colDef({
    colId: 'id',
    headerValueGetter: () => 'ID',
    width: 200,
    valueGetter: util.valueGetter(({ data }) => {
      return data.DamageID
    }),
    getQuickFilterText: ({ value }) => value,
  })
}

export function damageColDamageType(util: DamageTableUtils) {
  return util.colDef({
    colId: 'damageType',
    headerValueGetter: () => 'DamageType',
    valueGetter: util.valueGetter(({ data }) => data.DamageType),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColAttackType(util: DamageTableUtils) {
  return util.colDef({
    colId: 'attackType',
    headerValueGetter: () => 'AttackType',
    valueGetter: util.valueGetter(({ data }) => data.AttackType),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColDmgCoef(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoef',
    headerValueGetter: () => 'DmgCoef',
    field: util.fieldName('DmgCoef'),
    ...util.precision,
  })
}

export function damageColDmgCoefCrit(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoefCrit',
    headerValueGetter: () => 'DmgCoefCrit',
    field: util.fieldName('DmgCoefCrit'),
    ...util.precision,
  })
}

export function damageColDmgCoefHead(util: DamageTableUtils) {
  return util.colDef({
    colId: 'dmgCoefHead',
    headerValueGetter: () => 'DmgCoefHead',
    field: util.fieldName('DmgCoefHead'),
    ...util.precision,
  })
}

export function damageColCanCrit(util: DamageTableUtils) {
  return util.colDef({
    colId: 'canCrit',
    headerValueGetter: () => 'CanCrit',
    field: util.fieldName('CanCrit'),
  })
}

export function damageColCritHitStun(util: DamageTableUtils) {
  return util.colDef({
    colId: 'critHitStun',
    headerValueGetter: () => 'CritHitStun',
    field: util.fieldName('CritHitStun'),
  })
}

export function damageColCritPowerLevel(util: DamageTableUtils) {
  return util.colDef({
    colId: 'critPowerLevel',
    headerValueGetter: () => 'CritPowerLevel',
    field: util.fieldName('CritPowerLevel'),
  })
}

export function damageColAffixes(util: DamageTableUtils) {
  return util.colDef({
    colId: 'affixes',
    headerValueGetter: () => 'Affixes',
    valueGetter: util.valueGetter(({ data }) => data.Affixes),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColAffliction(util: DamageTableUtils) {
  return util.colDef({
    colId: 'affliction',
    headerValueGetter: () => 'Affliction',
    valueGetter: util.fieldGetter('Affliction'),
    width: 200,
    filter: SelectFilter,
  })
}
