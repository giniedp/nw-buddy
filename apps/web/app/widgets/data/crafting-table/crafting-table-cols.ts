import {
  NW_FALLBACK_ICON,
  getCraftingCategoryLabel,
  getCraftingGroupLabel,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getTradeSkillLabel,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { RangeFilter, SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type CraftingTableUtils = TableGridUtils<CraftingTableRecord>
export type CraftingTableRecord = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $ingredients: Array<ItemDefinitionMaster | Housingitems>
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
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    headerName: 'Name',
    valueGetter: util.valueGetter(({ data }) => {
      return util.i18n.get(data.RecipeNameOverride || data.$item?.Name)
    }),
    getQuickFilterText: ({ value }) => value,
  })
}

export function craftingColID(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'itemId',
    headerValueGetter: () => 'Item ID',
    field: util.fieldName('ItemID'),
    hide: true,
  })
}

export function craftingColIngredients(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'ingredients',
    headerValueGetter: () => 'Ingredients',
    width: 200,
    sortable: false,
    headerName: 'Ingredients',
    valueGetter: util.valueGetter(({ data }) => data.$ingredients?.map(getItemId)),
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
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
      optionsGetter: (node) => {
        const items = (node.data as CraftingTableRecord).$ingredients || []
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
  return util.colDef({
    colId: 'requiredExpansion',
    headerValueGetter: () => 'Expansion',
    width: 180,
    valueGetter: util.fieldGetter('RequiredExpansion'),
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
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      optionsGetter: ({ data }) => {
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
  return util.colDef({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.mark || 0),
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (data: CraftingTableRecord) => getItemId(data.$item),
      pref: util.itemPref,
    }),
  })
}

export function craftingColInStock(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'userStock',
    headerValueGetter: () => 'In Stock',
    headerTooltip: 'Number of items currently owned',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.stock),
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
  return util.colDef({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.price),
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
  //
  return util.colDef({
    colId: 'tradeskill',
    headerValueGetter: () => 'Tradeskill',
    width: 120,
    valueGetter: util.valueGetter(({ data }) => data.Tradeskill),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getTradeSkillLabel(value))),
    filter: SelectFilter,
  })
}
export function craftingColCategory(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'craftingCategory',
    headerValueGetter: () => 'Crafting Category',
    width: 150,
    valueGetter: util.valueGetter(({ data }) => data.CraftingCategory),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getCraftingCategoryLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function craftingColGroup(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'craftingGroup',
    headerValueGetter: () => 'Crafting Group',
    width: 150,
    valueGetter: util.valueGetter(({ data }) => data.CraftingGroup),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getCraftingGroupLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function craftingColRecipeLevel(util: CraftingTableUtils) {
  //
  return util.colDef({
    colId: 'recipeLevel',
    headerValueGetter: () => 'Recipe Level',
    width: 120,
    field: util.fieldName('RecipeLevel'),
    filter: RangeFilter,
    cellStyle: {
      'text-align': 'right',
    },
  })
}

export function craftingColItemChance(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'bonusItemChance',
    headerValueGetter: () => 'Bonus Chance',
    width: 120,
    field: util.fieldName('BonusItemChance'),
    valueGetter: util.valueGetter(({ data }) => Math.round((data.BonusItemChance || 0) * 100)),
    valueFormatter: ({ value }) => `${value}%`,
    filter: RangeFilter,
    cellStyle: {
      'text-align': 'right',
    },
  })
}

export function craftingColCooldownQuantity(util: CraftingTableUtils) {
  return util.colDef({
    colId: 'cooldownQuantity',
    headerValueGetter: () => 'Cooldown Quantity',
    field: util.fieldName('CooldownQuantity'),
    filter: RangeFilter,
    valueFormatter: ({ value }) => {
      return value ? value : ''
    },
    cellStyle: {
      'text-align': 'right',
    },
    width: 130,
  })
}
export function craftingColCooldownCeconds(util: CraftingTableUtils) {
  //
  return util.colDef({
    colId: 'cooldownSeconds',
    headerValueGetter: () => 'Cooldown Time',
    field: util.fieldName('CooldownSeconds'),
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
