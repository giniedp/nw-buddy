import { Signal } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  getCraftingCategoryLabel,
  getCraftingGroupLabel,
  getCraftingXP,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getTradeSkillLabel,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { CraftingRecipeData, GameEventData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { RangeFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type CraftingTableUtils = TableGridUtils<CraftingTableRecord>
export type CraftingTableRecord = CraftingRecipeData & {
  $item: MasterItemDefinitions | HouseItems
  $ingredients: Array<MasterItemDefinitions | HouseItems>
  $gameEvent: GameEventData
}

export function craftingColIcon(util: CraftingTableUtils) {
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
      const item = data?.$item
      if (!item) {
        return null
      }
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
          isArtifact: isMasterItem(item) && isItemArtifact(item),
          isNamed: isMasterItem(item) && isItemNamed(item),
          rarity: getItemRarity(item),
        })
      )
    }),
  })
}

export function craftingColName(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    headerName: 'Name',
    valueGetter: ({ data }) => util.i18n.get(data.RecipeNameOverride || data.$item?.Name),
    getQuickFilterText: ({ value }) => value,
  })
}

export function craftingColID(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'itemId',
    headerValueGetter: () => 'Item ID',
    field: 'ItemID',
    hide: true,
  })
}

export function craftingColIngredients(util: CraftingTableUtils) {
  return util.colDef<string[]>({
    colId: 'ingredients',
    headerValueGetter: () => 'Ingredients',
    width: 200,
    sortable: false,
    headerName: 'Ingredients',
    valueGetter: ({ data }) => data.$ingredients?.map(getItemId),
    getQuickFilterText: ({ data }) => data.$ingredients?.map(({ Name }) => util.tl8(Name)).join(' '),
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$ingredients || []
      return util.el(
        'div.flex.flex-row.items-center.h-full',
        {},
        items.map((item) => {
          return util.elA(
            {
              attrs: { target: '_blank', href: util.tipLink('item', getItemId(item)) },
            },
            util.elItemIcon({
              class: ['transition-all scale-90 hover:scale-110'],
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
            })
          )
        })
      )
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$ingredients || []
        return items.map((item) => {
          return {
            id: getItemId(item),
            label: util.i18n.get(item.Name),
            icon: getItemIconPath(item),
          }
        })
      },
    }),
  })
}

export function craftingColExpansion(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'requiredExpansion',
    headerValueGetter: () => 'Expansion',
    width: 180,
    field: 'RequiredExpansion',
    getQuickFilterText: ({ data }) => util.i18n.get(getItemExpansion(data?.RequiredExpansion)?.label),
    cellRenderer: util.cellRenderer(({ data }) => {
      const expansion = getItemExpansion(data?.RequiredExpansion)
      if (!expansion) {
        return null
      }
      //return `"${data.RequiredExpansion}"`
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
        const it = getItemExpansion(data?.RequiredExpansion)
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

export function craftingColBookmark(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => '',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.itemPref.get(getItemId(data.$item))?.mark || 0,
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (data: CraftingTableRecord) => getItemId(data.$item),
      pref: util.itemPref,
    }),
  })
}

export function craftingColInStock(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'userStock',
    headerValueGetter: () => 'In Stock',
    headerTooltip: 'Number of items currently owned',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => util.itemPref.get(getItemId(data.$item))?.stock,
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (data: CraftingTableRecord) => getItemId(data.$item),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function craftingColPrice(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => util.itemPref.get(getItemId(data.$item))?.price,
    cellClass: 'text-right',
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (data: CraftingTableRecord) => getItemId(data.$item),
      pref: util.itemPref,
      mode: 'price',
      // formatter: util.moneyFormatter, TODO: fix
    }),
    width: 100,
  })
}

export function craftingColTradeskill(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'tradeskill',
    headerValueGetter: () => 'Tradeskill',
    width: 120,
    valueGetter: ({ data }) => data.Tradeskill,
    valueFormatter: ({ value }) => util.i18n.get(getTradeSkillLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getTradeSkillLabel(value)),
    ...util.selectFilter({
      order: 'asc',
    })
  })
}

export function craftingColCraftingXP(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'craftingXP',
    headerValueGetter: () => 'Crafting XP',
    width: 120,
    valueGetter: ({ data }) => getCraftingXP(data, data.$gameEvent),
    filter: 'agNumberColumnFilter',
  })
}

export function craftingColCanCraft(util: CraftingTableUtils, skills: Signal<Record<string, number>>) {
  return util.colDef<boolean>({
    colId: 'userCanCraft',
    headerValueGetter: () => 'Can Craft',
    width: 100,
    cellClass: 'cursor-pointer',
    headerTooltip: 'Whether you can craft this item based on your current tradeskill level',
    valueGetter: ({ data }) => skills()?.[data.Tradeskill] >= data.RecipeLevel,
    getQuickFilterText: () => '',
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('span.badge.badge-sm', {
        class: value ? ['badge-success', 'badge-outline'] : 'badge-error',
        text: value ? 'Yes' : 'No',
      })
    }),
    ...util.selectFilter({
      order: 'asc',
    })
  })
}

export function craftingColCategory(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'craftingCategory',
    headerValueGetter: () => 'Crafting Category',
    width: 150,
    valueGetter: ({ data }) => data.CraftingCategory,
    valueFormatter: ({ value }) => util.i18n.get(getCraftingCategoryLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getCraftingCategoryLabel(value)),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    })
  })
}

export function craftingColGroup(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'craftingGroup',
    headerValueGetter: () => 'Crafting Group',
    width: 150,
    valueGetter: ({ data }) => data.CraftingGroup,
    valueFormatter: ({ value }) => util.i18n.get(getCraftingGroupLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getCraftingGroupLabel(value)),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function craftingColRecipeLevel(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'recipeLevel',
    headerValueGetter: () => 'Recipe Level',
    getQuickFilterText: () => '',
    width: 120,
    field: 'RecipeLevel',
    filter: RangeFilter,
    cellStyle: {
      'text-align': 'right',
    },
  })
}

export function craftingColItemChance(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'bonusItemChance',
    headerValueGetter: () => 'Bonus Chance',
    getQuickFilterText: () => '',
    width: 120,
    field: 'BonusItemChance',
    valueGetter: ({ data }) => Math.round((data.BonusItemChance || 0) * 100),
    valueFormatter: ({ value }) => `${value}%`,
    filter: RangeFilter,
    cellStyle: {
      'text-align': 'right',
    },
  })
}

export function craftingColCooldownQuantity(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'cooldownQuantity',
    headerValueGetter: () => 'Cooldown Quantity',
    getQuickFilterText: () => '',
    field: 'CooldownQuantity',
    filter: RangeFilter,
    valueFormatter: ({ value }) => String(value ? value : ''),
    cellStyle: {
      'text-align': 'right',
    },
    width: 130,
  })
}
export function craftingColCooldownCeconds(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'cooldownSeconds',
    headerValueGetter: () => 'Cooldown Time',
    getQuickFilterText: () => '',
    field: 'CooldownSeconds',
    valueFormatter: ({ value }) => {
      if (!value) {
        return ''
      }
      const now = new Date()
      const then = addSeconds(now, value)
      return formatDistanceStrict(now, then)
    },
    width: 130,
  })
}
