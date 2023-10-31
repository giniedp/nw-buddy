import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwWeaponType } from '~/nw/weapon-types'
import { TableGridUtils } from '~/ui/data/table-grid'

export type WeaponTypeTableUtils = TableGridUtils<WeaponTypeTableRecord>
export type WeaponTypeTableRecord = NwWeaponType

export function weaponTypeColIcon(util: WeaponTypeTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elItemIcon({
        class: ['transition-all translate-x-0 hover:translate-x-1'],
        icon: data?.IconPathSmall || NW_FALLBACK_ICON,
      })
    }),
  })
}

export function weaponTypeColName(util: WeaponTypeTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 300,
    valueGetter: ({ data }) => util.i18n.get(data.MasteryName),
    getQuickFilterText: ({ value }) => value,
  })
}

export function weaponTypeColID(util: WeaponTypeTableUtils) {
  return util.colDef<string>({
    colId: 'weaponTypeID',
    headerValueGetter: () => 'ID',
    field: 'WeaponTypeID',
    hide: true,
  })
}
export function weaponTypeColGroupName(util: WeaponTypeTableUtils) {
  return util.colDef<string>({
    colId: 'groupName',
    headerValueGetter: () => 'Group Name',
    width: 300,
    valueGetter: ({ data }) => util.i18n.get(data.GroupName),
    getQuickFilterText: ({ value }) => value,
  })
}
