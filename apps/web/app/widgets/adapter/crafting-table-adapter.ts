import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import m from 'mithril'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { IconComponent, nwdbLinkUrl, NwService } from '~/nw'
import { getIngretientsFromRecipe, getItemIconPath, getItemId, getItemIdFromRecipe, getItemRarity } from '~/nw/utils'
import { humanize, shareReplayRefCount } from '~/utils'
import { RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

export type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
  $ingredients: Array<ItemDefinitionMaster | Housingitems>
}

@Injectable()
export class CraftingTableAdapter extends DataTableAdapter<RecipeWithItem> {
  public entityID(item: RecipeWithItem): string {
    return item.RecipeID
  }

  public entityCategory(item: RecipeWithItem): string {
    return item.Tradeskill
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        {
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: this.cellRenderer(({ data }) => {
            const item = data?.$item
            if (!item) {
              return null
            }
            return this.createLinkWithIcon({
              target: '_blank',
              href: nwdbLinkUrl('item', getItemId(item)),
              icon: getItemIconPath(item),
              rarity: getItemRarity(item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          })
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => {
            if (!data.$item) {
              return this.i18n.get(data.RecipeNameOverride)
            }
            return this.i18n.get(data.$item?.Name)
          }),
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 200,
          sortable: false,
          headerName: 'Ingredients',
          field: this.fieldName('$ingredients'),
          cellRenderer: this.cellRenderer(({ data }) => {
            const items = data.$ingredients || []
            return this.createElement({
              tag: 'div',
              classList: ['flex', 'flex-row', 'items-center', 'h-full'],
              children: items.map((item) => {
                return this.createLinkWithIcon({
                  target: '_blank',
                  href: nwdbLinkUrl('item', getItemId(item)),
                  icon: getItemIconPath(item),
                  iconClass: ['transition-all', 'scale-90', 'hover:scale-110']
                })
              })
            })
          }),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true,
            showCondition: true,
            optionsGetter: (node) => {
              const items = (node.data as RecipeWithItem).$ingredients || []
              return items.map((item) => {
                return {
                  label: this.i18n.get(item.Name),
                  value: item,
                  icon: getItemIconPath(item),
                }
              })
            },
          }),
        },
        {
          headerName: 'User Data',
          children: [
            {
              width: 100,
              headerName: 'Bookmark',
              cellClass: 'cursor-pointer',
              filter: ItemTrackerFilter,
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(getItemId(data.$item))?.mark || 0),
              cellRenderer: BookmarkCell,
              cellRendererParams: BookmarkCell.params({
                getId: (data: RecipeWithItem) => getItemId(data.$item),
                pref: this.nw.itemPref
              }),
            },
            {
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(getItemId(data.$item))?.stock),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (data: RecipeWithItem) => getItemId(data.$item),
                pref: this.nw.itemPref,
                mode: 'stock',
                class: 'text-right',
              }),
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(getItemId(data.$item))?.price),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (data: RecipeWithItem) => getItemId(data.$item),
                pref: this.nw.itemPref,
                mode: 'price',
                formatter: this.moneyFormatter,
              }),
              width: 100,
            },
          ],
        },
        {
          width: 120,
          field: this.fieldName('Tradeskill'),
          filter: SelectboxFilter,
        },
        {
          width: 150,
          field: this.fieldName('CraftingCategory'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true,
          }),
        },
        {
          width: 150,
          field: this.fieldName('CraftingGroup'),
          filter: SelectboxFilter,
          valueFormatter: ({ value }) => humanize(value),
          filterParams: SelectboxFilter.params({
            showSearch: true,
          }),
        },
        {
          width: 120,
          headerName: 'Recipe Level',
          field: this.fieldName('RecipeLevel'),
          filter: RangeFilter,
          cellStyle: {
            'text-align': 'right',
          },
        },
        {
          width: 120,
          headerName: 'Bonus Chance',
          field: this.fieldName('BonusItemChance'),
          valueGetter: this.valueGetter(({ data }) => Math.round((data.BonusItemChance || 0) * 100)),
          valueFormatter: ({ value }) => `${value}%`,
          filter: RangeFilter,
          cellStyle: {
            'text-align': 'right',
          },
        },
      ],
    })
  )

  public entities: Observable<RecipeWithItem[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
      recipes: this.nw.db.recipes,
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

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
