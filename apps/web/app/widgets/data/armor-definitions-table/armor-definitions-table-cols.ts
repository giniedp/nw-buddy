import { NW_FALLBACK_ICON } from '@nw-data/common'
import { ArmorItemDefinitions } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type ArmorDefinitionTableUtils = TableGridUtils<ArmorDefinitionTableRecord>
export type ArmorDefinitionTableRecord = ArmorItemDefinitions

export function armorDefColIcon(util: ArmorDefinitionTableUtils) {
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
        icon: NW_FALLBACK_ICON, // getWeaponTypeByProgressionId(data.WeaponMasteryCategoryId)?.IconPathSmall || NW_FALLBACK_ICON,
      })
    }),
  })
}
export function armorDefColID(util: ArmorDefinitionTableUtils) {
  return util.colDef<string>({
    colId: 'weaponID',
    headerValueGetter: () => 'ID',
    field: 'WeaponID',
    getQuickFilterText: ({ value }) => value,
  })
}
