import {
  ItemRarity,
  NW_FALLBACK_ICON,
  getAffixMODs,
  getItemAttribution,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemRarity,
  getItemRarityLabel,
  getItemRarityWeight,
  getItemSourceShort,
  getItemTierAsRoman,
  getItemTradingFamilyLabel,
  getItemTradingGroupLabel,
  getItemTypeLabel,
  getTradingCategoryLabel,
  isItemArtifact,
  isItemNamed,
  isItemResource,
  isMasterItem,
} from '@nw-data/common'
import { AffixStatData, HouseItems, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { RangeFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { assetUrl, humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type ItemTableUtils = TableGridUtils<ItemTableRecord>
export type ItemTableRecord = MasterItemDefinitions & {
  $source?: string
  $perks?: PerkData[]
  $affixes?: AffixStatData[]
  $perkBuckets?: string[]
  $transformTo?: MasterItemDefinitions | HouseItems
  $transformFrom?: Array<MasterItemDefinitions | HouseItems>
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
          // isResource: isMasterItem(data) && isItemResource(data),
          rarity: getItemRarity(data),
        }),
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

export function itemColTransformTo(util: ItemTableUtils) {
  return util.colDef<string>({
    colId: 'transformTo',
    headerValueGetter: () => 'Transform To',
    sortable: true,
    valueGetter: ({ data }) => getItemId(data.$transformTo),
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data.$transformTo
      if (!item) {
        return null
      }
      return util.el('div.flex.flex-row.items-center.h-full', {}, [
        util.elA(
          {
            class: ['flex', 'flex-row', 'items-center', 'h-full'],
            attrs: {
              target: '_blank',
              href: util.tipLink('item', getItemId(item)),
            },
          },
          [
            util.elItemIcon({
              class: ['w-8 h-8 flex-none'],
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
              isArtifact: isMasterItem(item) && isItemArtifact(item),
              isNamed: isMasterItem(item) && isItemNamed(item),
              rarity: getItemRarity(item),
            }),
            ,
          ],
        ),
        util.el('span.pl-2', { text: util.i18n.get(item.Name) }),
      ])
    }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
      getOptions: ({ data }) => {
        const item = data.$transformTo
        if (!item) {
          return []
        }
        return [
          {
            id: getItemId(item),
            label: util.i18n.get(item.Name),
            icon: getItemIconPath(item),
          },
        ]
      },
    }),
  })
}

export function itemColTransformFrom(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'transformFrom',
    headerValueGetter: () => 'Transform From',
    sortable: true,
    valueGetter: ({ data }) => data.$transformFrom?.map(getItemId),
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$transformFrom
      if (!items?.length) {
        return null
      }
      return util.el('div.flex.flex-row.items-center.h-full', {}, [
        ...items.map((item) =>
          util.elA(
            {
              class: ['block', 'flex-nonw'],
              attrs: {
                target: '_blank',
                href: util.tipLink('item', getItemId(item)),
              },
            },
            util.elItemIcon({
              class: ['w-8', 'h-8'],
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
              isArtifact: isMasterItem(item) && isItemArtifact(item),
              isNamed: isMasterItem(item) && isItemNamed(item),
              rarity: getItemRarity(item),
            }),
          ),
        ),
      ])
    }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
      getOptions: ({ data }) => {
        const items = data.$transformFrom
        if (!items?.length) {
          return []
        }
        return items.map((item) => {
          return {
            id: getItemId(item),
            label: util.i18n.get(item.Name) || humanize(getItemId(item)),
            icon: getItemIconPath(item) || NW_FALLBACK_ICON,
          }
        })
      },
    }),
  })
}

export function itemColPerks(
  util: TableGridUtils<MasterItemDefinitions & { $perks?: PerkData[]; $perkBuckets?: string[] }>,
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
            }),
          ),
        ),
        ...buckets.map(() => {
          return util.elImg({
            class: ['w-7', 'h-7', 'nw-icon'],
            src: assetUrl('/assets/icons/crafting_perkbackground.png'),
          })
        }),
      ])
    }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
      getOptions: ({ data }) => {
        const perks: PerkData[] = data.$perks || []
        return perks.map((perk) => {
          const text = util.i18n.get(
            perk.DisplayName || perk.SecondaryEffectDisplayName || perk.AppliedSuffix || perk.AppliedPrefix,
          )
          return {
            id: perk.PerkID,
            label: text || perk.PerkID,
            icon: perk.IconPath,
          }
        })
      },
    }),
  })
}

export function itemColAttributeMods(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'attributeMods',
    headerValueGetter: () => 'Attr. Mods',
    width: 100,
    valueGetter: ({ data }) => {
      return data.$affixes
        .filter((it) => !!it)
        .map((it) => {
          const result = getAffixMODs(it, 0)
          if (result?.length) {
            return result
          }
          if (it.AttributePlacingMods) {
            return [
              {
                labelShort: 'MAG',
              },
            ]
          }
          return []
        })
        .flat(1)
        .map((it) => util.i18n.get(it.labelShort))
    },
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
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
    width: 130,
    cellClass: ({ value }) => 'text-rarity-' + value,
    comparator: (a, b) => getItemRarityWeight(a) - getItemRarityWeight(b),
    ...util.selectFilter({
      order: 'asc',
      getOptions: ({ data }) => {
        const value = getItemRarity(data)
        return [
          {
            id: value,
            label: util.i18n.get(getItemRarityLabel(value)),
            order: getItemRarityWeight(value),
            class: ['text-rarity-' + value],
          },
        ]
      },
    }),
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
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function itemColBookmark(util: TableGridUtils<MasterItemDefinitions>) {
  return util.colDef<number>({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => '',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID.toLowerCase())?.mark || 0,
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
      pref: util.itemPref,
    }),
  })
}

export function itemColStockCount(util: TableGridUtils<MasterItemDefinitions>) {
  return util.colDef<number>({
    colId: 'userStockCount',
    headerValueGetter: () => 'In Stock',
    getQuickFilterText: () => '',
    suppressHeaderMenuButton: false,
    headerTooltip: 'Number of items currently owned',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.stock,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function itemColOwnedWithGS(util: TableGridUtils<MasterItemDefinitions>) {
  return util.colDef<number>({
    colId: 'userOwnedWithGS',
    headerValueGetter: () => 'Owned GS',
    getQuickFilterText: () => '',
    headerTooltip: 'Item owned with this gear score',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.gs,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
      pref: util.itemPref,
      mode: 'gs',
    }),
    width: 100,
  })
}
export function itemColPrice(util: TableGridUtils<MasterItemDefinitions>) {
  return util.colDef<number>({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    getQuickFilterText: () => '',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: ({ data }) => util.itemPref.get(data.ItemID)?.price,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
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
    valueGetter: ({ data }) => getItemSourceShort(data),
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    width: 125,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const it = getItemAttribution(data)
        return it
          ? [
              {
                id: it.id,
                label: util.i18n.get(it.label) + (it.year ? ` (${it.year})` : ''),
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function itemColItemClass(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    width: 250,
    valueGetter: util.fieldGetter('ItemClass'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
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
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
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
            api.setGridOption('pinnedTopRowData', [node.data])
          })
        },
      })
    }),
  })
}
