import {
  ItemRarity,
  NW_FALLBACK_ICON,
  getItemAttribution,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemRarity,
  getItemRarityLabel,
  getItemRarityWeight,
  getItemTierAsRoman,
  getItemTradingFamilyLabel,
  getItemTradingGroupLabel,
  getItemTypeLabel,
  getTradingCategoryLabel,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { RangeFilter, SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { assetUrl, humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type ItemTableUtils = TableGridUtils<ItemTableRecord>
export type ItemTableRecord = ItemDefinitionMaster & {
  $perks?: Perks[]
  $perkBuckets?: string[]
}

export function itemColIcon(util: ItemTableUtils) {
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
            href: util.tipLink('item', getItemId(data)),
            target: '_blank',
          },
        },
        util.elItemIcon({
          class: ['transition-all translate-x-0 hover:translate-x-1'],
          icon: getItemIconPath(data) || NW_FALLBACK_ICON,
          isArtifact: isMasterItem(data) && isItemArtifact(data),
          isNamed: isMasterItem(data) && isItemNamed(data),
          rarity: getItemRarity(data),
        })
      )
    }),
  })
}

export function itemColName(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    sortable: true,
    filter: true,
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(data.Name),
    cellRenderer: util.cellRenderer(({ value }) => util.lineBreaksToHtml(value)),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
  })
}

export function itemColItemId(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'itemId',
    headerValueGetter: () => 'Item ID',
    field: 'ItemID',
    hide: true,
  })
}

export function itemColPerks(
  util: TableGridUtils<ItemDefinitionMaster & { $perks?: Perks[]; $perkBuckets?: string[] }>
) {
  return util.colDef<string[]>({
    colId: 'perks',
    width: 175,
    sortable: false,
    headerValueGetter: () => 'Perks',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => data.$perks?.map((it) => it?.PerkID),
    cellRenderer: util.cellRenderer(({ data }) => {
      const perks = data.$perks || []
      const buckets = data.$perkBuckets || []
      if (!!perks && !buckets) {
        return null
      }
      return util.el('div.flex.flex-row.items-center.h-full', {}, [
        ...perks.map((perk) =>
          util.elA(
            {
              class: ['block', 'w-7', ' h-7'],
              attrs: {
                target: '_blank',
                href: util.tipLink('perk', perk?.PerkID),
              },
            },
            util.elImg({
              class: ['w-7', 'h-7', 'nw-icon'],
              src: perk?.IconPath,
            })
          )
        ),
        ...buckets.map(() => {
          return util.elImg({
            class: ['w-7', 'h-7', 'nw-icon'],
            src: assetUrl('assets/icons/crafting_perkbackground.png'),
          })
        }),
      ])
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
      optionsGetter: ({ data }) => {
        const perks: Perks[] = data.$perks || []
        return perks.map((perk) => {
          const text = util.i18n.get(
            perk.DisplayName || perk.SecondaryEffectDisplayName || perk.AppliedSuffix || perk.AppliedPrefix
          )
          return {
            id: perk.PerkID,
            label: text,
            icon: perk.IconPath,
          }
        })
      },
    }),
  })
}

export function itemColRarity(util: ItemTableUtils) {
  return util.colDef<ItemRarity>({
    colId: 'rarity',
    headerValueGetter: () => 'Rarity',
    valueGetter: ({ data }) => getItemRarity(data),
    valueFormatter: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      comaparator: (a, b) => getItemRarityWeight(b.id as ItemRarity) - getItemRarityWeight(a.id as ItemRarity),
    }),
    comparator: (a, b) => getItemRarityWeight(a) - getItemRarityWeight(b),
    width: 130,
  })
}

export function itemColTier(util: ItemTableUtils) {
  return util.colDef<number>({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    getQuickFilterText: () => '',
    width: 80,
    valueGetter: ({ data }) => data.Tier || null,
    valueFormatter: ({ value }) => getItemTierAsRoman(value),
    filter: SelectFilter,
  })
}

export function itemColBookmark(util: TableGridUtils<ItemDefinitionMaster>) {
  return util.colDef<number>({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => '',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.mark || 0,
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: util.itemPref,
    }),
  })
}

export function itemColStockCount(util: TableGridUtils<ItemDefinitionMaster>) {
  return util.colDef<number>({
    colId: 'userStockCount',
    headerValueGetter: () => 'In Stock',
    getQuickFilterText: () => '',
    suppressMenu: false,
    headerTooltip: 'Number of items currently owned',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.stock,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function itemColOwnedWithGS(util: TableGridUtils<ItemDefinitionMaster>) {
  return util.colDef<number>({
    colId: 'userOwnedWithGS',
    headerValueGetter: () => 'Owned GS',
    getQuickFilterText: () => '',
    headerTooltip: 'Item owned with this gear score',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.gs,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: util.itemPref,
      mode: 'gs',
    }),
    width: 100,
  })
}
export function itemColPrice(util: TableGridUtils<ItemDefinitionMaster>) {
  return util.colDef<number>({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    getQuickFilterText: () => '',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.price,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: util.itemPref,
      mode: 'price',
      // TODO:
      // formatter: this.moneyFormatter,
    }),
    width: 100,
  })
}

export function itemColGearScore(util: ItemTableUtils) {
  return util.colDef<[number, number]>({
    colId: 'gearScore',
    headerValueGetter: () => 'Gear Score',
    getQuickFilterText: () => '',
    width: 120,
    cellClass: 'text-right',
    comparator: (a, b) => {
      if (a[1] !== b[1]) {
        return (a[1] || 0) - (b[1] || 0)
      }
      return (a[0] || 0) - (b[0] || 0)
    },
    valueGetter: ({ data }) => {
      let min = getItemMinGearScore(data, false)
      let max = getItemMaxGearScore(data, false)
      return [min, max]
    },
    valueFormatter: ({ value }) => {
      if (value[0] === value[1]) {
        return String(value[0] ?? '')
      }
      return `${value[0]}-${value[1]}`
    },
    filter: RangeFilter,
  })
}

export function itemColSource(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerValueGetter: () => 'Source',
    valueGetter: ({ data }) => data['$source'],
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    width: 125,
    filter: SelectFilter,
  })
}

export function itemColEvent(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'attributionId',
    headerValueGetter: () => 'Event',
    width: 180,
    field: 'AttributionId',
    getQuickFilterText: ({ data }) => util.i18n.get(getItemAttribution(data)?.label),
    cellRenderer: util.cellRenderer(({ data }) => {
      const expansion = getItemAttribution(data)
      if (!expansion) {
        return null
      }
      return util.el('div.flex.flex-row.gap-1.items-center', {}, [
        util.elImg({
          class: ['w-6', 'h-6'],
          src: expansion.icon,
        }),
        util.el('span', { text: util.i18n.get(expansion.label) }),
      ])
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params<ItemTableRecord>({
      optionsGetter: ({ data }) => {
        const it = getItemAttribution(data)
        return it
          ? [
              {
                id: it.id,
                label: util.i18n.get(it.label),
                icon: it.icon,
              },
            ]
          : []
      },
    }),
  })
}

export function itemColExpansion(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'requiredExpansion',
    headerValueGetter: () => 'Expansion',
    width: 180,
    field: 'RequiredExpansionId',
    getQuickFilterText: ({ data }) => util.i18n.get(getItemExpansion(data?.RequiredExpansionId)?.label),
    cellRenderer: ({ data }) => {
      const expansion = getItemExpansion(data?.RequiredExpansionId)
      if (!expansion) {
        return null
      }
      return util.el('div.flex.flex-row.gap-1.items-center', {}, [
        util.elImg({
          class: ['w-6', 'h-6'],
          src: expansion.icon,
        }),
        util.el('span', { text: util.i18n.get(expansion.label) }),
      ])
    },
    filter: SelectFilter,
    filterParams: SelectFilter.params<ItemTableRecord>({
      optionsGetter: ({ data }) => {
        const it = getItemExpansion(data?.RequiredExpansionId)
        return it
          ? [
              {
                id: it.id,
                label: util.i18n.get(it.label),
                icon: it.icon,
              },
            ]
          : []
      },
    }),
  })
}

export function itemColItemTypeName(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'itemTypeDisplayName',
    headerValueGetter: () => 'Item Type Name',
    field: 'ItemTypeDisplayName',
    valueFormatter: ({ value }) => util.i18n.get(value) || humanize(value),
    getQuickFilterText: ({ value }) => util.i18n.get(value) || humanize(value),
    width: 150,
    filter: SelectFilter,
  })
}

export function itemColItemType(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'itemType',
    headerValueGetter: () => 'Item Type',
    field: 'ItemType',
    valueFormatter: ({ value }) => util.i18n.get(getItemTypeLabel(value) || humanize(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemTypeLabel(value) || humanize(value)),
    width: 125,
    filter: SelectFilter,
  })
}

export function itemColItemClass(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    width: 250,
    field: 'ItemClass',
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingGroup(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'tradingGroup',
    headerValueGetter: () => 'Trading Group',
    field: 'TradingGroup',
    valueFormatter: ({ value }) => util.i18n.get(getItemTradingGroupLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemTradingGroupLabel(value)),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingFamily(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'tradingFamily',
    headerValueGetter: () => 'Trading Family',
    width: 125,
    field: 'TradingFamily',
    valueFormatter: ({ value }) => util.i18n.get(getItemTradingFamilyLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemTradingFamilyLabel(value)),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingCategory(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'tradingCategory',
    headerValueGetter: () => 'Trading Category',
    width: 125,
    field: 'TradingCategory',
    valueFormatter: ({ value }) => util.i18n.get(getTradingCategoryLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getTradingCategoryLabel(value)),
    filter: SelectFilter,
  })
}

export function colDefPin(util: ItemTableUtils) {
  return util.colDef({
    colId: 'pin',
    headerValueGetter: () => '',
    width: 80,
    sortable: false,
    cellRenderer: util.cellRenderer(({ api, node }) => {
      return util.el('div.btn.btn-sm', {
        text: 'Pin',
        class: [],
        tap: (el: HTMLElement) => {
          el.addEventListener('click', () => {
            api.setPinnedTopRowData([node.data])
          })
        },
      })
    }),
  })
}
