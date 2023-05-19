import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { Observable, combineLatest, defer, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import {
  getCraftingCategoryLabel,
  getCraftingGroupLabel,
  getIngretientsFromRecipe,
  getItemIconPath,
  getItemId,
  getItemIdFromRecipe,
  getItemRarity,
  getTradeSkillLabel,
} from '~/nw/utils'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { ItemPreferencesService } from '~/preferences'
import { RangeFilter, SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { shareReplayRefCount } from '~/utils'
import { ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

export type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $ingredients: Array<ItemDefinitionMaster | Housingitems>
}

@Injectable()
export class CraftingTableAdapter extends DataTableAdapter<RecipeWithItem> {
  public static provider() {
    return dataTableProvider({
      adapter: CraftingTableAdapter,
    })
  }

  public entityID(item: RecipeWithItem): string {
    return item.RecipeID
  }

  public entityCategory(item: RecipeWithItem): DataTableCategory {
    if (!item.Tradeskill) {
      return null
    }
    return {
      value: item.Tradeskill,
      label: this.i18n.get(getTradeSkillLabel(item.Tradeskill)),
      icon: '',
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            const item = data?.$item
            if (!item) {
              return null
            }
            return this.createLinkWithIcon({
              target: '_blank',
              href: this.info.link('item', getItemId(item)),
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
              rarity: getItemRarity(item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => {
            return this.i18n.get(data.RecipeNameOverride || data.$item?.Name)
          }),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'itemId',
          headerValueGetter: () => 'Item ID',
          field: this.fieldName('ItemID'),
          hide: true,
        }),
        this.colDef({
          colId: 'ingredients',
          headerValueGetter: () => 'Ingredients',
          width: 200,
          sortable: false,
          headerName: 'Ingredients',
          valueGetter: this.valueGetter(({ data }) => data.$ingredients?.map((it) => getItemId(it))),
          field: this.fieldName('$ingredients'),
          cellRenderer: this.cellRenderer(({ data }) => {
            const items = data.$ingredients || []
            return this.createElement({
              tag: 'div',
              classList: ['flex', 'flex-row', 'items-center', 'h-full'],
              children: items.map((item) => {
                return this.createLinkWithIcon({
                  target: '_blank',
                  href: this.info.link('item', getItemId(item)),
                  icon: getItemIconPath(item),
                  iconClass: ['transition-all', 'scale-90', 'hover:scale-110'],
                })
              }),
            })
          }),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
            optionsGetter: (node) => {
              const items = (node.data as RecipeWithItem).$ingredients || []
              return items.map((item) => {
                return {
                  id: getItemId(item),
                  label: this.i18n.get(item.Name),
                  icon: getItemIconPath(item),
                }
              })
            },
          }),
        }),
        this.colDef({
          colId: 'userBookmark',
          headerValueGetter: () => 'Bookmark',
          width: 100,
          cellClass: 'cursor-pointer',
          filter: ItemTrackerFilter,
          valueGetter: this.valueGetter(({ data }) => this.itemPref.get(getItemId(data.$item))?.mark || 0),
          cellRenderer: BookmarkCell,
          cellRendererParams: BookmarkCell.params({
            getId: (data: RecipeWithItem) => getItemId(data.$item),
            pref: this.itemPref,
          }),
        }),
        this.colDef({
          colId: 'userStock',
          headerValueGetter: () => 'In Stock',
          headerTooltip: 'Number of items currently owned',
          valueGetter: this.valueGetter(({ data }) => this.itemPref.get(getItemId(data.$item))?.stock),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (data: RecipeWithItem) => getItemId(data.$item),
            pref: this.itemPref,
            mode: 'stock',
            class: 'text-right',
          }),
          width: 90,
        }),
        this.colDef({
          colId: 'userPrice',
          headerValueGetter: () => 'Price',
          headerTooltip: 'Current price in Trading post',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => this.itemPref.get(getItemId(data.$item))?.price),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (data: RecipeWithItem) => getItemId(data.$item),
            pref: this.itemPref,
            mode: 'price',
            formatter: this.moneyFormatter,
          }),
          width: 100,
        }),
        this.colDef({
          colId: 'tradeskill',
          headerValueGetter: () => 'Tradeskill',
          width: 120,
          field: this.fieldName('Tradeskill'),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getTradeSkillLabel(value))),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'craftingCategory',
          headerValueGetter: () => 'Crafting Category',
          width: 150,
          field: this.fieldName('CraftingCategory'),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getCraftingCategoryLabel(value))),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'craftingGroup',
          headerValueGetter: () => 'Crafting Group',
          width: 150,
          field: this.fieldName('CraftingGroup'),
          valueFormatter: this.valueFormatter<string>(({ value }) => this.i18n.get(getCraftingGroupLabel(value))),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'recipeLevel',
          headerValueGetter: () => 'Recipe Level',
          width: 120,
          field: this.fieldName('RecipeLevel'),
          filter: RangeFilter,
          cellStyle: {
            'text-align': 'right',
          },
        }),
        this.colDef({
          colId: 'bonusItemChance',
          headerValueGetter: () => 'Bonus Chance',
          width: 120,
          field: this.fieldName('BonusItemChance'),
          valueGetter: this.valueGetter(({ data }) => Math.round((data.BonusItemChance || 0) * 100)),
          valueFormatter: ({ value }) => `${value}%`,
          filter: RangeFilter,
          cellStyle: {
            'text-align': 'right',
          },
        }),
        this.colDef({
          colId: 'cooldownQuantity',
          headerValueGetter: () => 'Cooldown Quantity',
          field: this.fieldName('CooldownQuantity'),
          filter: RangeFilter,
          valueFormatter: ({ value }) => {
            return value ? value : ''
          },
          cellStyle: {
            'text-align': 'right',
          },
          width: 130,
        }),
        this.colDef({
          colId: 'cooldownSeconds',
          headerValueGetter: () => 'Cooldown Time',
          field: this.fieldName('CooldownSeconds'),
          valueFormatter: ({ value }) => {
            if (!value) {
              return ''
            }
            const now = new Date()
            const then = addSeconds(now, value)
            return formatDistanceStrict(now, then)
          },
          width: 130,
        }),
      ],
    })
  )

  public entities: Observable<RecipeWithItem[]> = defer(() => {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      recipes: this.db.recipes,
    }).pipe(
      map(({ items, housing, recipes }) => {
        recipes = recipes.filter((it) => !!it.Tradeskill)
        return recipes.map<RecipeWithItem>((it) => {
          const itemId = getItemIdFromRecipe(it)
          return {
            ...it,
            $item: items.get(itemId) || housing.get(itemId),
            $ingredients: getIngretientsFromRecipe(it)
              .map((ing) => items.get(ing.ingredient) || housing.get(ing.ingredient))
              .filter((it) => !!it),
          }
        })
      })
    )
  }).pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private itemPref: ItemPreferencesService,
    private i18n: TranslateService,
    private info: NwLinkService
  ) {
    super()
  }
}
