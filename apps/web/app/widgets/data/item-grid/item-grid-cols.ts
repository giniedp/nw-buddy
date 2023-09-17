import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemRarity,
  getItemRarityLabel,
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
import { ItemPreferencesService } from '~/preferences'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { assetUrl, humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type ItemGridUtils = DataGridUtils<ItemGridRecord>
export type ItemGridRecord = ItemDefinitionMaster & {
  $perks?: Perks[]
  $perkBuckets?: string[]
}

export function itemColIcon(util: ItemGridUtils) {
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
            href: util.nwLink.link('item', getItemIconPath(data)),
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

export function itemColName(util: ItemGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    sortable: true,
    filter: true,
    width: 250,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.Name)),
    cellRenderer: util.cellRenderer(({ value }) => util.lineBreaksToHtml(value)),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    getQuickFilterText: ({ value }) => value,
  })
}

export function itemColItemId(util: ItemGridUtils) {
  return util.colDef({
    colId: 'itemId',
    headerValueGetter: () => 'Item ID',
    field: util.fieldName('ItemID'),
    hide: true,
  })
}

export function itemColPerks(
  util: DataGridUtils<ItemDefinitionMaster & { $perks?: Perks[]; $perkBuckets?: string[] }>
) {
  return util.colDef({
    colId: 'perks',
    width: 175,
    sortable: false,
    headerValueGetter: () => 'Perks',
    valueGetter: util.valueGetter(({ data }) => data.$perks?.map((it) => it?.PerkID)),
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
                href: util.nwLink.link('perk', perk?.PerkID),
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
          return {
            id: perk.PerkID,
            label: util.i18n.get(perk.DisplayName || perk.AppliedSuffix || perk.AppliedPrefix),
            icon: perk.IconPath,
          }
        })
      },
    }),
  })
}

export function itemColRarity(util: ItemGridUtils) {
  return util.colDef({
    colId: 'rarity',
    headerValueGetter: () => 'Rarity',
    valueGetter: util.valueGetter(({ data }) => getItemRarity(data)),
    valueFormatter: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemRarityLabel(value)),
    filter: SelectFilter,
    width: 130,
  })
}

export function itemColTier(util: ItemGridUtils) {
  return util.colDef({
    colId: 'tier',
    headerValueGetter: () => 'Tier',
    width: 80,
    valueGetter: util.valueGetter(({ data }) => data.Tier || null),
    valueFormatter: ({ value }) => getItemTierAsRoman(value),
    filter: SelectFilter,
  })
}

export function itemColBookmark(util: DataGridUtils<ItemDefinitionMaster>, pref: ItemPreferencesService) {
  return util.colDef({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: util.valueGetter(({ data }) => pref.get(data.ItemID)?.mark || 0),
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: pref,
    }),
  })
}

export function itemColStockCount(util: DataGridUtils<ItemDefinitionMaster>, pref: ItemPreferencesService) {
  return util.colDef({
    colId: 'userStockCount',
    headerValueGetter: () => 'In Stock',
    suppressMenu: false,
    headerTooltip: 'Number of items currently owned',
    valueGetter: util.valueGetter(({ data }) => pref.get(data.ItemID)?.stock),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: pref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function itemColOwnedWithGS(util: DataGridUtils<ItemDefinitionMaster>, pref: ItemPreferencesService) {
  return util.colDef({
    colId: 'userOwnedWithGS',
    headerValueGetter: () => 'Owned GS',
    headerTooltip: 'Item owned with this gear score',
    valueGetter: util.valueGetter(({ data }) => pref.get(data.ItemID)?.gs),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: pref,
      mode: 'gs',
    }),
    width: 100,
  })
}
export function itemColPrice(util: DataGridUtils<ItemDefinitionMaster>, pref: ItemPreferencesService) {
  return util.colDef({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: util.valueGetter(({ data }) => pref.get(data.ItemID)?.price),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: ItemDefinitionMaster) => getItemId(value),
      pref: pref,
      mode: 'price',
      // TODO:
      // formatter: this.moneyFormatter,
    }),
    width: 100,
  })
}

export function itemColGearScore(util: ItemGridUtils) {
  return util.colDef({
    colId: 'gearScore',
    headerValueGetter: () => 'Gear Score',
    width: 120,
    cellClass: 'text-right',
    comparator: (a, b) => {
      if (a[1] !== b[1]) {
        return (a[1] || 0) - (b[1] || 0)
      }
      return (a[0] || 0) - (b[0] || 0)
    },
    valueGetter: util.valueGetter(({ data }) => {
      let min = getItemMinGearScore(data, false)
      let max = getItemMaxGearScore(data, false)
      return [min, max]
    }),
    valueFormatter: ({ value }) => {
      if (value[0] === value[1]) {
        return String(value[0] ?? '')
      }
      return `${value[0]}-${value[1]}`
    },
    filter: RangeFilter,
  })
}

export function itemColSource(util: ItemGridUtils) {
  return util.colDef({
    colId: 'source',
    headerValueGetter: () => 'Source',
    valueGetter: util.fieldGetter('$source' as any),
    valueFormatter: ({ value }) => humanize(value),
    width: 125,
    filter: SelectFilter,
  })
}

export function itemColEvent(util: ItemGridUtils) {
  return util.colDef({
    colId: 'attributionId',
    headerValueGetter: () => 'Event',
    width: 180,
    valueGetter: util.fieldGetter('AttributionId'),
    valueFormatter: ({ value }) => humanize(value),
    filter: SelectFilter,
  })
}

export function itemColItemType(util: ItemGridUtils) {
  return util.colDef({
    colId: 'itemType',
    headerValueGetter: () => 'Item Type',
    valueGetter: util.valueGetter(({ data }) => data.ItemType),
    valueFormatter: ({ value }) => util.i18n.get(getItemTypeLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getItemTypeLabel(value)),
    width: 125,
    filter: SelectFilter,
  })
}

export function itemColItemClass(util: ItemGridUtils) {
  return util.colDef({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    width: 250,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    valueGetter: util.valueGetter(({ data }) => data.ItemClass),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingGroup(util: ItemGridUtils) {
  return util.colDef({
    colId: 'tradingGroup',
    headerValueGetter: () => 'Trading Group',
    valueGetter: util.valueGetter(({ data }) => data.TradingGroup),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getItemTradingGroupLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingFamily(util: ItemGridUtils) {
  return util.colDef({
    colId: 'tradingFamily',
    headerValueGetter: () => 'Trading Family',
    width: 125,
    valueGetter: util.valueGetter(({ data }) => data.TradingFamily),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getItemTradingFamilyLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}

export function itemColTradingCategory(util: ItemGridUtils) {
  return util.colDef({
    colId: 'tradingCategory',
    headerValueGetter: () => 'Trading Category',
    width: 125,
    valueGetter: util.valueGetter(({ data }) => data.TradingCategory),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getTradingCategoryLabel(value))),
    filter: SelectFilter,
  })
}

export function colDefPin(util: ItemGridUtils) {
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