import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster, Lootlimits } from '@nw-data/generated'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { TableGridUtils } from '~/ui/data/table-grid'

export type LootLimitTableUtils = TableGridUtils<LootLimitTableRecord>
export type LootLimitTableRecord = Lootlimits & {
  $item: ItemDefinitionMaster | Housingitems
}

export function lootLimitColIcon(util: LootLimitTableUtils) {
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
      return util.elA(
        {
          attrs: {
            href: util.tipLink('item', getItemId(data.$item)),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: getItemIconPath(data.$item) || NW_FALLBACK_ICON,
          isArtifact: isMasterItem(data.$item) && isItemArtifact(data.$item),
          isNamed: isMasterItem(data.$item) && isItemNamed(data.$item),
          rarity: getItemRarity(data.$item),
        })
      )
    }),
  })
}
export function lootLimitColName(util: LootLimitTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: ({ data }) => {
      return data.$item ? util.i18n.get(data.$item?.Name) : data.LootLimitID
    },
    getQuickFilterText: ({ value }) => value,
  })
}
export function lootLimitColCountLimit(util: LootLimitTableUtils) {
  return util.colDef<number>({
    colId: 'countLimit',
    headerValueGetter: () => 'Count Limit',
    getQuickFilterText: () => '',
    field: 'CountLimit',
    width: 130,
  })
}
export function lootLimitColTimeBetweenDrops(util: LootLimitTableUtils) {
  return util.colDef<[number, number]>({
    colId: 'timeBetweenDrops',
    headerValueGetter: () => 'Time Between Drops',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => {
      return [data.MinLimitSeconds, data.MaxLimitSeconds]
    },
    valueFormatter: ({ value }) => {
      return (value as Number[])
        .filter((it) => !!it)
        .map((it: number) => {
          const now = new Date()
          const then = addSeconds(now, it)
          return formatDistanceStrict(now, then)
        })
        .join(' - ')
    },
    width: 130,
  })
}
export function lootLimitColLimitExpiresAfter(util: LootLimitTableUtils) {
  return util.colDef<number>({
    colId: 'limitExpiresAfter',
    headerValueGetter: () => 'Cooldown',
    field: 'LimitExpireSeconds',
    valueFormatter: ({ value }) => {
      const now = new Date()
      const then = addSeconds(now, value)
      return formatDistanceStrict(now, then)
    },
    width: 130,
  })
}
