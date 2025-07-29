import {
  ItemRarity,
  NW_FALLBACK_ICON,
  getAffixMODs,
  getExclusiveLabelIntersection,
  getItemAttribution,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemPerkBucketIds,
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
  isMasterItem,
  isPerkApplicableToItem,
} from '@nw-data/common'
import {
  AffixStatData,
  CategoricalProgressionData,
  ConsumableItemDefinitions,
  HouseItems,
  ItemCurrencyConversionData,
  MasterItemDefinitions,
  PerkData,
} from '@nw-data/generated'
import { uniq } from 'lodash'
import { RangeFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { assetUrl, humanize } from '~/utils'
import { BookmarkCell, TrackGsCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type ItemTableUtils = TableGridUtils<ItemTableRecord>
export type ItemTableRecord = MasterItemDefinitions & {
  $source?: string
  $perks?: PerkData[]
  $consumable?: ConsumableItemDefinitions
  $affixes?: AffixStatData[]
  $perkBuckets?: string[]
  $transformTo?: MasterItemDefinitions | HouseItems
  $transformFrom?: Array<MasterItemDefinitions | HouseItems>
  $conversions?: Array<ItemCurrencyConversionData>
  $shops?: Array<
    Pick<
      CategoricalProgressionData,
      'CategoricalProgressionId' | 'DisplayName' | 'DisplayDescription' | 'IconPath' | 'EventId'
    >
  >
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
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Perks',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => data.$perks?.map((it) => it?.PerkID),
    cellRenderer: util.cellRenderer(({ data }) => {
      const perks = data.$perks || []
      const buckets = data.$perkBuckets || []
      if (!!perks && !buckets) {
        return null
      }
      getItemPerkBucketIds
      return util.el('div.flex.flex-row.items-center.h-full.gap-[1px]', {}, [
        ...perks.map((perk) => {
          const isApplicableInvalid = !isPerkApplicableToItem(perk, data)
          const isExclusiveInvalid = perks.some((it) => it !== perk && !!getExclusiveLabelIntersection(it, perk).length)
          return util.elA(
            {
              class: [
                'block',
                'w-7',
                'h-7',
                'indicator',
                'rounded',
                isApplicableInvalid ? 'bg-warning/80' : null,
                isExclusiveInvalid ? 'bg-error/80' : null,
              ],
              attrs: {
                target: '_blank',
                href: util.tipLink('perk', perk?.PerkID),
              },
            },
            [
              util.elImg({
                class: ['w-7', 'h-7', 'nw-icon'],
                src: perk?.IconPath,
              }),
            ].filter((it) => !!it),
          )
        }),
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

export function itemColPerkValidity(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'perksValidity',
    width: 175,
    sortable: false,
    hide: true,
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Perks Validity',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => {
      const result: string[] = []
      for (const perk of data.$perks || []) {
        if (!isPerkApplicableToItem(perk, data)) {
          result.push('item')
        }
        if (data.$perks.some((it) => it !== perk && !!getExclusiveLabelIntersection(it, perk).length)) {
          result.push('exclusive')
        }
      }
      if (!result.length && data.$perks?.length) {
        result.push('valid')
      }
      return uniq(result)
    },
    cellRenderer: ({ value }) => {
      return util.el(
        'div.flex.flex-row.flex-wrap.gap-1.items-center',
        {},
        value?.map((tag: string) => {
          if (tag === 'valid') {
            return util.el('span.badge.badge-sm.badge-success', { text: tag })
          }
          if (tag === 'item') {
            return util.el('span.badge.badge-sm.badge-warning', { text: tag })
          }
          return util.el('span.badge.badge-sm.badge-error', { text: tag })
        }),
      )
    },
    ...util.selectFilter({
      search: true,
      order: 'asc',
      getOptions: (it) => {
        return [
          {
            id: 'valid',
            label: 'Valid',
          },
          {
            id: 'item',
            label: 'Invalid item class',
          },
          {
            id: 'exclusive',
            label: 'Exclisive tags intersect',
          },
        ]
      },
    }),
  })
}
export function itemColAttributeMods(util: ItemTableUtils) {
  return util.colDef<string[]>({
    colId: 'attributeMods',
    headerValueGetter: () => 'Attr. Mods',
    width: 100,
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => '',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.character.getItemMarker(data.ItemID) || 0,
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
      character: util.character,
    }),
  })
}

export function itemColStockCount(util: TableGridUtils<MasterItemDefinitions>) {
  return util.colDef<number>({
    colId: 'userStockCount',
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Owned GS',
    headerTooltip: 'Item owned with this gear score',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => util.character.getItemGearScore(data.ItemID),
    cellRenderer: TrackGsCell,
    cellRendererParams: TrackGsCell.params({
      getId: (value: MasterItemDefinitions) => getItemId(value),
      character: util.character,
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
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
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
    headerClass: 'bg-secondary/15',
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
export function itemColShops(util: ItemTableUtils) {
  return util.colDef({
    colId: 'currencyShops',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Shops',
    width: 150,
    valueGetter: ({ data }) => data.$shops?.map((it) => it?.CategoricalProgressionId),
    cellRenderer: util.cellRenderer(({ data }) => {
      const shops = data.$shops || []
      return util.el('div.flex.flex-row.items-center.h-full', {}, [
        ...shops.map((shop) =>
          util.elImg({
            class: ['w-7', 'h-7', 'nw-icon', 'flex-none'],
            src: shop?.IconPath || NW_FALLBACK_ICON,
          }),
        ),
      ])
    }),
    ...util.selectFilter({
      search: true,
      order: 'asc',
      getOptions: ({ data }) => {
        const shops = data.$shops || []
        return shops.map((shop) => {
          return {
            id: shop.CategoricalProgressionId,
            label: shop.EventId ? humanize(shop.EventId) : util.i18n.get(shop.DisplayName),
            icon: shop.IconPath || NW_FALLBACK_ICON,
          }
        })
      },
    }),
  })
}
