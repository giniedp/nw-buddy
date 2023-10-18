import {
  LootBucketRow,
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

export type LootBucketTableUtils = TableGridUtils<LootBucketTableRecord>
export type LootBucketTableRecord = LootBucketRow & {
  $item: ItemDefinitionMaster | Housingitems
}

export function lootBucketColIcon(util: LootBucketTableUtils) {
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
      const item = data.$item
      return util.elA(
        {
          attrs: {
            href: util.tipLink('item', getItemId(item)),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: getItemIconPath(item) || NW_FALLBACK_ICON,
          isArtifact: isMasterItem(data) && isItemArtifact(data),
          isNamed: isMasterItem(data) && isItemNamed(data),
          rarity: getItemRarity(item),
        })
      )
    }),
  })
}

export function lootBucketColName(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'lootBucket',
    headerValueGetter: () => 'Bucket',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => {
      return data.LootBucket
    }),
    getQuickFilterText: ({ value }) => value,
  })
}

export function lootBucketColColumn(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'clumn',
    headerValueGetter: () => 'Column',
    field: util.fieldName('Column'),
    width: 130,
  })
}

export function lootBucketColItem(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'item',
    headerValueGetter: () => 'Item',
    valueGetter: util.valueGetter(({ data }) => {
      return util.tl8(data.$item.Name)
    }),
    getQuickFilterText: ({ data }) => [data.Item, util.tl8(data.$item.Name)].join(' '),
    width: 250,
  })
}

export function lootBucketColMatchOne(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'matchOne',
    headerValueGetter: () => 'Match One',
    field: util.fieldName('MatchOne'),
    width: 130,
  })
}

export function lootBucketColQuantity(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'quantity',
    headerValueGetter: () => 'Quantity',
    field: util.fieldName('Quantity'),
    width: 130,
  })
}

export function lootBucketColTags(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'tags',
    headerValueGetter: () => 'Tags',
    valueGetter: util.valueGetter(({ data }) => {
      return Array.from(data.Tags.values())
    }),
    cellRenderer: util.tagsRenderer({
      transform: (it) => {
        if (!it.Value) {
          return it.Name
        }
        if (it.Value.length === 1) {
          return [it.Name, it.Value[0]].join(': ')
        }
        return [it.Name, it.Value.join('-')].join(': ')
      },
    }),
    width: 600,
  })
}
