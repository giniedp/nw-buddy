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
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { ParsedLootTag } from 'libs/nw-data/common/loot'
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
        }),
      )
    }),
  })
}

export function lootBucketColName(util: LootBucketTableUtils) {
  return util.colDef<string>({
    colId: 'lootBucket',
    headerValueGetter: () => 'Bucket',
    width: 250,
    field: 'LootBucket',
  })
}

export function lootBucketColColumn(util: LootBucketTableUtils) {
  return util.colDef<number>({
    colId: 'clumn',
    headerValueGetter: () => 'Column',
    field: 'Column',
    getQuickFilterText: () => '',
    width: 130,
  })
}

export function lootBucketColItem(util: LootBucketTableUtils) {
  return util.colDef<string>({
    colId: 'item',
    headerValueGetter: () => 'Item',
    valueGetter: ({ data }) => util.tl8(data.$item.Name),
    getQuickFilterText: ({ data }) => [data.Item, util.tl8(data.$item.Name)].join(' '),
    width: 250,
  })
}

export function lootBucketColMatchOne(util: LootBucketTableUtils) {
  return util.colDef<boolean>({
    colId: 'matchOne',
    headerValueGetter: () => 'Match One',
    field: 'MatchOne',
    getQuickFilterText: () => '',
    width: 130,
  })
}

export function lootBucketColQuantity(util: LootBucketTableUtils) {
  return util.colDef<number[]>({
    colId: 'quantity',
    headerValueGetter: () => 'Quantity',
    getQuickFilterText: () => '',
    field: 'Quantity',
    width: 130,
  })
}

export function lootBucketColTags(util: LootBucketTableUtils) {
  return util.colDef<string[]>({
    colId: 'tags',
    headerValueGetter: () => 'Tags',
    valueGetter: ({ data }) => {
      return Array.from(data.Tags.values()).map(formatTag)
    },
    cellRenderer: util.tagsRenderer({
      //transform: formatTag,
    }),
    useValueFormatterForExport: true,
    width: 600,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    })
  })
}

function formatTag(tag: ParsedLootTag) {
  if (!tag.value) {
    return tag.name
  }
  if (tag.value.length === 1) {
    return [tag.name, tag.value[0]].join(': ')
  }
  return [tag.name, tag.value.join('-')].join(': ')
}
