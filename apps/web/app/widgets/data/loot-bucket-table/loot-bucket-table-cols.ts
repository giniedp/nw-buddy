import {
  LootBucketRow,
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemTypeLabel,
  getUIHousingCategoryLabel,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { ParsedLootTag } from 'libs/nw-data/common/loot'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '../../../utils'

export type LootBucketTableUtils = TableGridUtils<LootBucketTableRecord>
export type LootBucketTableRecord = LootBucketRow & {
  $item: MasterItemDefinitions | HouseItems
}

export function lootBucketColIcon(util: LootBucketTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    headerClass: 'bg-secondary/15',
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

export function lootBucketColSource(util: LootBucketTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerValueGetter: () => 'Source',
    headerClass: 'bg-secondary/15',
    width: 250,
    field: '$source',
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

export function lootBucketColOdds(util: LootBucketTableUtils) {
  return util.colDef<number>({
    colId: 'odds',
    headerValueGetter: () => 'Odds',
    getQuickFilterText: () => '',
    field: 'Odds',
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
    }),
  })
}

export function lootBucketColItemClass(util: LootBucketTableUtils) {
  return util.colDef<string[]>({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    headerClass: 'bg-secondary/15',
    width: 250,
    field: '$item.ItemClass',
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
    }),
  })
}

export function lootBucketColUiHousingCategory(util: LootBucketTableUtils) {
  return util.colDef<string>({
    colId: 'uiHousingCategory',
    headerValueGetter: () => 'Housing Category',
    headerClass: 'bg-secondary/15',
    field: '$item.UIHousingCategory',
    valueFormatter: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getUIHousingCategoryLabel(value)),
    width: 150,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function lootBucketColItemType(util: LootBucketTableUtils) {
  return util.colDef<string>({
    colId: 'itemType',
    headerValueGetter: () => 'Item Type',
    headerClass: 'bg-secondary/15',
    field: '$item.ItemType',
    valueFormatter: ({ value }) => util.i18n.get(getItemTypeLabel(value) || humanize(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemTypeLabel(value) || humanize(value)),
    width: 125,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
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
