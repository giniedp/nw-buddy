import { NW_FALLBACK_ICON, getItemIconPath, getItemId } from '@nw-data/common'
import { BackstoryDefinition, TerritoryDefinition } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'
import { InventoryItem } from '../backstory-detail/types'

export type BackstoryTableUtils = TableGridUtils<BackstoryTableRecord>
export type BackstoryTableRecord = BackstoryDefinition & {
  $respawnTerritories: TerritoryDefinition[]
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Territories',
    width: 400,
    autoHeight: true,
    hide: true,
    valueGetter: ({ data }) => data.$respawnTerritories?.map((it) => it.NameLocalizationKey),
    getQuickFilterText: ({ value }) => value.map((it) => util.tl8(it)).join(' '),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
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
        items.map(({ item, isNamed, rarity }) => {
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
              isArtifact: rarity === 'artifact',
              isNamed: isNamed,
              rarity: rarity,
            }),
          )
        }),
      )
    }),
  })
}
