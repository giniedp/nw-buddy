import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { Backstorydata, Housingitems, ItemDefinitionMaster, Territorydefinitions } from '@nw-data/generated'
import { ItemInstance } from '~/data'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export interface InventoryItem extends ItemInstance {
  item: ItemDefinitionMaster | Housingitems
}

export type BackstoryTableUtils = TableGridUtils<BackstoryTableRecord>
export type BackstoryTableRecord = Backstorydata & {
  $respawnTerritories: Territorydefinitions[]
  $inventoryItems: InventoryItem[]
}

export function backstoryColID(util: BackstoryTableUtils) {
  return util.colDef<string>({
    colId: 'backstoryID',
    headerValueGetter: () => 'ID',
    width: 200,
    field: 'BackstoryID',
    hide: true,
    getQuickFilterText: ({ value }) => value,
  })
}

export function backstoryColName(util: BackstoryTableUtils) {
  return util.colDef<string>({
    colId: 'backstoryName',
    headerValueGetter: () => 'Name',
    width: 400,
    valueGetter: ({ data }) => humanize(data.BackstoryName),
    getQuickFilterText: ({ value }) => value,
  })
}

export function backstoryColLevel(util: BackstoryTableUtils) {
  return util.colDef<number>({
    colId: 'levelOverride',
    width: 100,
    headerValueGetter: () => 'Level',
    field: 'LevelOverride',
  })
}
export function backstoryColType(util: BackstoryTableUtils) {
  return util.colDef<string>({
    colId: 'playtestType',
    headerValueGetter: () => 'Type',
    field: 'PlaytestType',
  })
}
export function backstoryColPvp(util: BackstoryTableUtils) {
  return util.colDef<boolean>({
    colId: 'pvPFlag',
    headerValueGetter: () => 'PvP',
    field: 'PvPFlag',
  })
}

export function backstoryColTerritories(util: BackstoryTableUtils) {
  return util.colDef<string[]>({
    colId: 'respawnPointTerritories',
    headerValueGetter: () => 'Territories',
    width: 400,
    autoHeight: true,
    hide: true,
    valueGetter: ({ data }) => data.$respawnTerritories?.map((it) => it.NameLocalizationKey),
    getQuickFilterText: ({ value }) => value.map((it) => util.tl8(it)).join(' '),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function backstoryColInventory(util: BackstoryTableUtils) {
  return util.colDef<InventoryItem[]>({
    colId: 'inventoryItem',
    headerValueGetter: () => 'Inventory',
    valueGetter: ({ data }) => data.$inventoryItems,
    getQuickFilterText: ({ value }) => value.map(({ item }) => util.tl8(item.Name)).join(' '),
    width: 800,
    minWidth: 400,
    autoHeight: true,
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$inventoryItems || []
      return util.el(
        'div.flex.flex-row.flex-wrap.gap-1',
        {},
        items.map(({ item }) => {
          return util.elA(
            {
              attrs: {
                href: util.tipLink('item', getItemId(item)),
                target: '_blank',
              },
            },
            util.elItemIcon({
              class: ['block aspect-square'],
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
              isArtifact: isMasterItem(item) && isItemArtifact(item),
              isNamed: isMasterItem(item) && isItemNamed(item),
              rarity: getItemRarity(item),
            }),
          )
        }),
      )
    }),
  })
}
