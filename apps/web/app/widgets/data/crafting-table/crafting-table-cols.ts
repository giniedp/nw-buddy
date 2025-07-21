import {
  NW_FALLBACK_ICON,
  canCraftWithLevel,
  getCraftingCategoryLabel,
  getCraftingGroupLabel,
  getCraftingSkillXP,
  getCraftingStandingXP,
  getItemExpansion,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getTradeSkillLabel,
  isCraftedWithFactionYieldBonus,
  isCraftedWithYieldBonus,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import {
  CraftingRecipeData,
  GameEventData,
  HouseItems,
  MasterItemDefinitions,
  ScannedStation,
} from '@nw-data/generated'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { CharacterStore } from '~/data'
import { RangeFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'
import { BookmarkCell, TrackingCell } from '~/widgets/adapter/components'
import { ItemTrackerFilter } from '~/widgets/item-tracker'

export type CraftingTableUtils = TableGridUtils<CraftingTableRecord>
export type CraftingTableRecord = CraftingRecipeData & {
  $item: MasterItemDefinitions | HouseItems
  $ingredients: Array<CraftingIngredient>
  $gameEvent: GameEventData
  $stations: Array<Pick<ScannedStation, 'stationID' | 'name'>>
}
export type CraftingIngredient = {
  itemId: string
  categoryId: string
  label: string
  icon: string
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
        }),
      )
    }),
  })
}

export function craftingColName(util: CraftingTableUtils) {
  return util.colDef<string[]>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    headerName: 'Name',
    valueGetter: ({ data }) => {
      const name = util.i18n.get(data.RecipeNameOverride || data.$item?.Name)
      const itemName = util.i18n.get(data.$item?.Name)
      const result = [name]
      if (name !== itemName) {
        result.push(itemName)
      }
      return result
    },
    valueFormatter: ({ value }) => value[0], // csv export only geth the recipe name
    getQuickFilterText: ({ value }) => value.join(' '),
    cellRenderer: util.cellRenderer(({ value }) => {
      if (value.length > 1) {
        return util.el('div.flex.flex-col', {}, [
          util.el('span', { text: value[0] }),
          util.el('span.text-xs.text-gray-500', { text: value[1] }),
        ])
      }
      return value[0]
    }),
  })
}

export function craftingColFilterText(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'additionalFilterText',
    headerValueGetter: () => 'Additional Filter Text',
    width: 200,
    valueGetter: ({ data }) => {
      const value = (data.AdditionalFilterText || '').split(' ').map((it) => it.replace(/^@/, ''))
      return util.i18n.get(value)
    },
  })
}

export function craftingColSource(util: CraftingTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Source',
    valueGetter: ({ data }) => (data['$source'] as string)?.replace('CraftingRecipes', ''),
    valueFormatter: ({ value }) => humanize(value),
    getQuickFilterText: ({ value }) => humanize(value),
    width: 125,
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
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
    headerClass: 'bg-secondary/15',
    width: 350,
    sortable: false,
    headerName: 'Ingredients',
    valueGetter: ({ data }) => data.$ingredients?.map((it) => it.itemId || it.categoryId),
    getQuickFilterText: () => null,
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$ingredients || []
      return util.el(
        'div.flex.flex-row.items-center.h-full',
        {},
        items.map((item) => {
          const icon = util.elItemIcon({
            class: ['transition-all scale-90 hover:scale-110'],
            icon: item.icon || NW_FALLBACK_ICON,
          })
          if (item.itemId) {
            return util.elA(
              {
                attrs: { target: '_blank', href: util.tipLink('item', item.itemId) },
              },
              icon,
            )
          }
          return util.el(
            'span',
            {
              attrs: {
                title: util.i18n.get(item.label),
              },
            },
            icon,
          )
        }),
      )
    }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$ingredients || []
        return items.map((item) => {
          return {
            id: item.itemId || item.categoryId,
            label: util.i18n.get(item.label),
            icon: item.icon || NW_FALLBACK_ICON,
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
    getQuickFilterText: () => null,
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Bookmark',
    getQuickFilterText: () => null,
    width: 100,
    cellClass: 'cursor-pointer',
    filter: ItemTrackerFilter,
    valueGetter: ({ data }) => util.character.getItemMarker(getItemId(data.$item)) || 0,
    cellRenderer: BookmarkCell,
    cellRendererParams: BookmarkCell.params({
      getId: (data: CraftingTableRecord) => getItemId(data.$item),
      character: util.character,
    }),
  })
}

export function craftingColInStock(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'userStock',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'In Stock',
    headerTooltip: 'Number of items currently owned',
    getQuickFilterText: () => null,
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
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Price',
    headerTooltip: 'Current price in Trading post',
    getQuickFilterText: () => null,
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
    width: 150,
    valueGetter: ({ data }) => data.Tradeskill,
    valueFormatter: ({ value }) => util.i18n.get(getTradeSkillLabel(value)),
    getQuickFilterText: ({ value }) => util.i18n.get(getTradeSkillLabel(value)),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function craftingColTradeskillEXP(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'tradeskillEXP',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Tradskill XP',
    width: 130,
    cellClass: 'text-right',
    valueGetter: ({ data }) => getCraftingSkillXP(data, data.$gameEvent),
    getQuickFilterText: () => null,
    filter: 'agNumberColumnFilter',
  })
}

export function craftingColStandingEXP(util: CraftingTableUtils) {
  return util.colDef<number>({
    colId: 'standingEXP',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Standing XP',
    width: 120,
    cellClass: 'text-right',
    valueGetter: ({ data }) => getCraftingStandingXP(data, data.$gameEvent),
    getQuickFilterText: () => null,
    filter: 'agNumberColumnFilter',
  })
}

export function craftingColCanCraft(util: CraftingTableUtils, char: CharacterStore) {
  return util.colDef<boolean>({
    colId: 'userCanCraft',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Can Craft',
    width: 100,
    cellClass: 'cursor-pointer',
    headerTooltip: 'Whether you can craft this item based on your current tradeskill level',
    valueGetter: ({ data }) => canCraftWithLevel(data, char.getTradeskillLevel(data.Tradeskill)),
    getQuickFilterText: () => null,
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('span.badge.badge-sm', {
        class: value ? ['badge-success', 'badge-outline'] : 'badge-error',
        text: value ? 'Yes' : 'No',
      })
    }),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function craftingColHasYieldBonus(util: CraftingTableUtils) {
  return util.colDef<string[]>({
    colId: 'hasYieldBonus',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Yield Bonus',
    width: 110,
    cellClass: 'cursor-pointer',
    headerTooltip: 'Yield bonuses that apply to this craft',
    valueGetter: ({ data }) => {
      const result: string[] = []
      if (isCraftedWithYieldBonus(data)) {
        result.push('Skill')
        result.push('Buff')
      }
      if (isCraftedWithFactionYieldBonus(data)) {
        result.push('Faction')
      }
      return result
    },
    getQuickFilterText: () => null,
    cellRenderer: util.tagsRenderer(),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function craftingColHasYieldBonusFromFort(util: CraftingTableUtils) {
  return util.colDef<boolean>({
    colId: 'hasFortYieldBonus',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Fort Yield Bonus',
    width: 130,
    cellClass: 'cursor-pointer',
    headerTooltip: 'Whether the item receives bonus from fort yield buff',
    valueGetter: ({ data }) => isCraftedWithFactionYieldBonus(data),
    getQuickFilterText: () => null,
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('span.badge.badge-sm', {
        class: value ? ['badge-success', 'badge-outline'] : 'badge-error',
        text: value ? 'Yes' : 'No',
      })
    }),
    ...util.selectFilter({
      order: 'asc',
    }),
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
    }),
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
    getQuickFilterText: () => null,
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
    getQuickFilterText: () => null,
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
    getQuickFilterText: () => null,
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
    getQuickFilterText: () => null,
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

export function craftingColStation(util: CraftingTableUtils) {
  return util.colDef<string[]>({
    colId: 'station',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Station',
    getQuickFilterText: () => null,
    valueGetter: ({ data }) => data.$stations?.map((it) => it.stationID),

    valueFormatter: ({ value, data }) => {
      if (!value) {
        return []
      }
      return data.$stations.map((it) => util.i18n.get(it.name?.replace(/^@/, '')) || humanize(it.stationID)) as any
    },
    width: 130,
    ...util.selectFilter({
      order: 'asc',
      getOptions: ({ data }) => {
        const items = data.$stations || []
        return items.map((item) => {
          return {
            id: item.stationID,
            label: util.i18n.get(item.name?.replace(/^@/, '')) || humanize(item.stationID),
          }
        })
      },
    }),
  })
}
