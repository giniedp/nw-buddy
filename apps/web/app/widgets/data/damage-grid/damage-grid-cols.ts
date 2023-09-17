import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Damagetable } from '@nw-data/generated'
import { damageTypeIcon } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'

export type DamageGridUtils = DataGridUtils<DamageGridRecord>
export type DamageGridRecord = Damagetable

export function damageColIcon(util: DamageGridUtils) {
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
        class: ['w-6', 'h-6'],
        src: damageTypeIcon(data.DamageType) || NW_FALLBACK_ICON,
      })
    }),
  })
}
export function damageColID(util: DamageGridUtils) {
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

export function damageColDamageType(util: DamageGridUtils) {
  return util.colDef({
    colId: 'damageType',
    headerValueGetter: () => 'DamageType',
    field: util.fieldName('DamageType'),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColAttackType(util: DamageGridUtils) {
  return util.colDef({
    colId: 'attackType',
    headerValueGetter: () => 'AttackType',
    field: util.fieldName('AttackType'),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColDmgCoef(util: DamageGridUtils) {
  return util.colDef({
    colId: 'dmgCoef',
    headerValueGetter: () => 'DmgCoef',
    field: util.fieldName('DmgCoef'),
    ...util.precision,
  })
}

export function damageColDmgCoefCrit(util: DamageGridUtils) {
  return util.colDef({
    colId: 'dmgCoefCrit',
    headerValueGetter: () => 'DmgCoefCrit',
    field: util.fieldName('DmgCoefCrit'),
    ...util.precision,
  })
}

export function damageColDmgCoefHead(util: DamageGridUtils) {
  return util.colDef({
    colId: 'dmgCoefHead',
    headerValueGetter: () => 'DmgCoefHead',
    field: util.fieldName('DmgCoefHead'),
    ...util.precision,
  })
}

export function damageColCanCrit(util: DamageGridUtils) {
  return util.colDef({
    colId: 'canCrit',
    headerValueGetter: () => 'CanCrit',
    field: util.fieldName('CanCrit'),
  })
}

export function damageColCritHitStun(util: DamageGridUtils) {
  return util.colDef({
    colId: 'critHitStun',
    headerValueGetter: () => 'CritHitStun',
    field: util.fieldName('CritHitStun'),
  })
}

export function damageColCritPowerLevel(util: DamageGridUtils) {
  return util.colDef({
    colId: 'critPowerLevel',
    headerValueGetter: () => 'CritPowerLevel',
    field: util.fieldName('CritPowerLevel'),
  })
}

export function damageColAffixes(util: DamageGridUtils) {
  return util.colDef({
    colId: 'affixes',
    headerValueGetter: () => 'Affixes',
    field: util.fieldName('Affixes'),
    width: 200,
    filter: SelectFilter,
  })
}

export function damageColAffliction(util: DamageGridUtils) {
  return util.colDef({
    colId: 'affliction',
    headerValueGetter: () => 'Affliction',
    field: util.fieldName('Affliction'),
    width: 200,
    filter: SelectFilter,
  })
}
