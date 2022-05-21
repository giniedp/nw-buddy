import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, tap } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { SelectboxFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { humanize, shareReplayRefCount } from '~/core/utils'
import { getItemIdFromRecipe, getItemRarity } from '~/core/nw/utils'
import { LocaleService, TranslateService } from '~/core/i18n'

export type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
}

@Injectable()
export class CraftingAdapterService extends DataTableAdapter<RecipeWithItem> {
  public entityID(item: RecipeWithItem): string {
    return item.RecipeID
  }

  public entityCategory(item: RecipeWithItem): string {
    return item.Tradeskill
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) => {
              const item = data?.$item
              if (!item) {
                return ''
              }
              return m(IconComponent, {
                src: item.IconPath,
                class: `w-9 h-9 nw-icon bg-rarity-${getItemRarity(item)}`,
              })
            },
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: ({ data }) => {
            const recipe = data as RecipeWithItem
            if (!recipe.$item) {
              return this.i18n.get(recipe.RecipeNameOverride)
            }
            return this.i18n.get(recipe.$item?.Name)
          },
          getQuickFilterText: ({ value }) => value,
        },
        {
          headerName: 'User Data',
          children: [
            {
              width: 100,
              headerName: 'Bookmark',
              cellClass: 'cursor-pointer',
              filter: ItemTrackerFilter,
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  const itemId = getItemIdFromRecipe(data)
                  return (
                    itemId &&
                    m(ItemMarkerCell, {
                      itemId: itemId,
                      meta: this.nw.itemPref,
                    })
                  )
                },
              }),
              valueGetter: ({ data }) => {
                const itemId = getItemIdFromRecipe(data)
                return (itemId && this.nw.itemPref.get(itemId)?.mark) || 0
              },
            },
            {
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => {
                const itemId = getItemIdFromRecipe(data)
                return itemId && this.nw.itemPref.get(itemId)?.stock
              }),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  const itemId = getItemIdFromRecipe(data)
                  return (
                    itemId &&
                    m(ItemTrackerCell, {
                      class: 'text-right',
                      itemId: itemId,
                      meta: this.nw.itemPref,
                      mode: 'stock',
                    })
                  )
                },
              }),
              width: 90,
            },
            {
              width: 100,
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => {
                const itemId = getItemIdFromRecipe(data)
                return itemId && this.nw.itemPref.get(itemId)?.price
              }),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  const itemId = getItemIdFromRecipe(data)
                  return (
                    itemId &&
                    m(ItemTrackerCell, {
                      class: 'text-right',
                      itemId: itemId,
                      meta: this.nw.itemPref,
                      mode: 'price',
                      formatter: this.moneyFormatter,
                    })
                  )
                },
              }),
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
            showSearch: true
          })
        },
        {
          width: 150,
          field: this.fieldName('CraftingGroup'),
          filter: SelectboxFilter,
          valueFormatter: ({ value }) => humanize(value),
          filterParams: SelectboxFilter.params({
            showSearch: true
          })
        },
        {
          width: 120,
          headerName: 'Recipe Level',
          field: this.fieldName('RecipeLevel'),
          cellStyle: {
            'text-align': 'right',
          },
        },
        {
          width: 120,
          headerName: 'Bonus Chance',
          field: this.fieldName('BonusItemChance'),
          valueGetter: this.valueGetter(({ data }) => `${Math.round((data.BonusItemChance || 0) * 100)}%`),
          cellStyle: {
            'text-align': 'right',
          },
        },
      ],
    }
  }

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
          }
        })
      })
    )
  }).pipe(shareReplayRefCount(1))

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
