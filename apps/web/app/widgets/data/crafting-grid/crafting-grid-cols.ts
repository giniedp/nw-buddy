import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE_BASE,
  getAbilityCategoryTag,
  getCraftingCategoryLabel,
  getCraftingGroupLabel,
  getItemIconPath,
  getItemId,
  getTradeSkillLabel,
  getWeaponTagLabel,
} from '@nw-data/common'
import { Ability, Crafting, Housingitems, ItemDefinitionMaster, Statuseffect } from '@nw-data/generated'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { map, switchMap } from 'rxjs'
import { NwWeaponType } from '~/nw/weapon-types'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { getIconFrameClass } from '~/ui/item-frame'
import { humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type CraftingGridUtils = DataGridUtils<CraftingGridRecord>
export type CraftingGridRecord = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $ingredients: Array<ItemDefinitionMaster | Housingitems>
}

export function craftingColIcon(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      const item = data?.$item
      if (!item) {
        return null
      }
      return util.elA(
        {
          attrs: {
            href: util.nwLink.link('item', getItemId(item)),
            target: '_blank',
          },
        },
        util.elPicture(
          {
            class: [...getIconFrameClass(item, true), 'transition-all translate-x-0 hover:translate-x-1'],
          },
          [
            util.el('span', { class: 'nw-item-icon-border' }),
            util.elImg({
              src: getItemIconPath(item) || NW_FALLBACK_ICON,
            }),
          ]
        )
      )
    }),
  })
}

export function craftingColName(util: CraftingGridUtils) {
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

export function craftingColID(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'itemId',
    headerValueGetter: () => 'Item ID',
    field: util.fieldName('ItemID'),
    hide: true,
  })
}

export function craftingColIngredients(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'ingredients',
    headerValueGetter: () => 'Ingredients',
    width: 200,
    sortable: false,
    headerName: 'Ingredients',
    valueGetter: util.valueGetter(({ data }) => data.$ingredients?.map(getItemId)),
    field: util.fieldName('$ingredients'),
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$ingredients || []
      return util.el(
        'div.flex.flex-row.items-center.h-full',
        {},
        items.map((item) => {
          return util.elA(
            {
              attrs: { target: '_blank', href: util.nwLink.link('item', getItemId(item)) },
            },
            util.elPicture(
              {
                class: [...getIconFrameClass(item, true), 'transition-all scale-90 hover:scale-110'],
              },
              [
                util.el('span', { class: 'nw-item-icon-border' }),
                util.elImg({
                  src: getItemIconPath(item) || NW_FALLBACK_ICON,
                }),
              ]
            )
          )
        })
      )
    }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
      optionsGetter: (node) => {
        const items = (node.data as CraftingGridRecord).$ingredients || []
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
export function craftingColBookmark(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'userBookmark',
    headerValueGetter: () => 'Bookmark',
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.mark || 0),
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (data: CraftingGridRecord) => getItemId(data.$item),
      pref: util.itemPref,
    }),
  })
}

export function craftingColInStock(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'userStock',
    headerValueGetter: () => 'In Stock',
    headerTooltip: 'Number of items currently owned',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.stock),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (data: CraftingGridRecord) => getItemId(data.$item),
      pref: util.itemPref,
      mode: 'stock',
      class: 'text-right',
    }),
    width: 90,
  })
}

export function craftingColPrice(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'userPrice',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    cellClass: 'text-right',
    valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.$item))?.price),
    cellRenderer: TrackingCell,
    cellRendererParams: TrackingCell.params({
      getId: (data: CraftingGridRecord) => getItemId(data.$item),
      pref: util.itemPref,
      mode: 'price',
      // formatter: util.moneyFormatter, TODO: fix
    }),
    width: 100,
  })
}
export function craftingColTradeskill(util: CraftingGridUtils) {
  //
  return util.colDef({
    colId: 'tradeskill',
    headerValueGetter: () => 'Tradeskill',
    width: 120,
    field: util.fieldName('Tradeskill'),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getTradeSkillLabel(value))),
    filter: SelectFilter,
  })
}
export function craftingColCategory(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'craftingCategory',
    headerValueGetter: () => 'Crafting Category',
    width: 150,
    field: util.fieldName('CraftingCategory'),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getCraftingCategoryLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function craftingColGroup(util: CraftingGridUtils) {
  return util.colDef({
    colId: 'craftingGroup',
    headerValueGetter: () => 'Crafting Group',
    width: 150,
    field: util.fieldName('CraftingGroup'),
    valueFormatter: util.valueFormatter<string>(({ value }) => util.i18n.get(getCraftingGroupLabel(value))),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function craftingColRecipeLevel(util: CraftingGridUtils) {
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

export function craftingColItemChance(util: CraftingGridUtils) {
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

export function craftingColCooldownQuantity(util: CraftingGridUtils) {
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
export function craftingColCooldownCeconds(util: CraftingGridUtils) {
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
