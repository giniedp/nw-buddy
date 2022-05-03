import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, tap } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { CategoryFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemTrackerCell } from '~/widgets/item-tracker'

export type RecipeWithItem = Crafting & {
  $item: ItemDefinitionMaster | Housingitems
}

function fieldName(key: keyof RecipeWithItem) {
  return key
}

function field<K extends keyof RecipeWithItem>(item: any, key: K): RecipeWithItem[K] {
  return item[key]
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
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: mithrilCell<RecipeWithItem>({
            view: ({ attrs: { data } }) => {
              const item = data?.$item
              if (!item) {
                return ''
              }
              return m(IconComponent, {
                src: this.nw.iconPath(item.IconPath),
                class: `w-9 h-9 nw-icon bg-rarity-${this.nw.itemRarity(item)}`,
              })
            }
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: ({ data }) => {
            const recipe = data as RecipeWithItem
            if (!recipe.$item) {
              return this.nw.translate(recipe.RecipeNameOverride)
            }
            return this.nw.translate(recipe.$item?.Name)
          },
          getQuickFilterText: ({ value }) => value,
        },
        {
          headerName: 'User Data',
          children: [
            {
              width: 80,
              headerName: 'Fav',
              cellRenderer: mithrilCell<RecipeWithItem>({
                view: ({ attrs }) => {
                  const truIcon = `<svg class="block w-6 h-6 fill-primary" viewBox="0 0 576 512"><path d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"/></svg>`
                  const falseIcon = `<svg class="block w-6 h-6 fill-primary opacity-50" viewBox="0 0 576 512"><path d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"/></svg>`
                  const itemId = this.nw.itemIdFromRecipe(attrs.data)
                  return itemId && m(
                    'div.h-full.flex.items-center',
                    {
                      onclick: () => {
                        this.nw.itemPref.toggleFavourite(itemId)
                        attrs.api.refreshCells({
                          columns: [attrs.column]
                        })
                      },
                    },
                    [m.trust(attrs.value ? truIcon : falseIcon)]
                  )
                },
              }),
              valueGetter: ({ data }) => {
                const itemId = this.nw.itemIdFromRecipe(data)
                return itemId && !!this.nw.itemPref.get(itemId)?.fav || false
              },
            },
            {
              headerName: 'Stock',
              headerTooltip: 'Number of items currently owned',
              cellRenderer: mithrilCell<RecipeWithItem>({
                view: ({ attrs: { data } }) => {
                  const itemId = this.nw.itemIdFromRecipe(data)
                  return itemId && m(ItemTrackerCell, {
                    itemId: itemId,
                    meta: this.nw.itemPref,
                    mode: 'stock',
                  })
                }
              }),
              width: 90,
            },
            {
              width: 100,
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellRenderer: mithrilCell<RecipeWithItem>({
                view: ({ attrs: { data } }) => {
                  const itemId = this.nw.itemIdFromRecipe(data)
                  return itemId && m(ItemTrackerCell, {
                    itemId: itemId,
                    meta: this.nw.itemPref,
                    mode: 'price',
                  })
                }
              }),
            },
          ],
        },
        {
          width: 120,
          field: fieldName('Tradeskill'),
          filter: CategoryFilter,
        },
        {
          width: 150,
          field: fieldName('CraftingCategory'),
          filter: CategoryFilter,
        },
        {
          width: 150,
          field: fieldName('CraftingGroup'),
          filter: CategoryFilter,
        },
        {
          width: 120,
          headerName: 'Recipe Level',
          field: fieldName('RecipeLevel'),
          cellStyle: {
            'text-align': 'right',
          },
        },
        {
          width: 120,
          headerName: 'Bonus Chance',
          field: fieldName('BonusItemChance'),
          valueGetter: ({ data }) => `${Math.round((field(data, 'BonusItemChance') || 0) * 100)}%`,
          cellStyle: {
            'text-align': 'right',
          },
        },
        {
          headerName: 'Bonus Increments',
          filter: false,
          cellRenderer: mithrilCell<RecipeWithItem>({
            view: ({ attrs }) => {
              const increments = parseItemChance(attrs.data.BonusItemChanceIncrease)
              const decrements = parseItemChance(attrs.data.BonusItemChanceDecrease)
              return m('div.flex.flex-col.text-sm.text-right', [
                m(
                  'span.flex.flex-row',
                  increments.map((it) => m('span.w-12.flex-none', it))
                ),
                m(
                  'span.flex.flex-row',
                  decrements.map((it) => m('span.w-12.flex-none', it))
                ),
              ])
            },
          }),
        },
      ],
    })
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
          const itemId = this.nw.itemIdFromRecipe(it)
          return {
            ...it,
            $item: items.get(itemId) || housing.get(itemId),
          }
        })
      })
    )
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService) {
    super()
  }
}

function parseItemChance(data: string) {
  return (data || '')?.split(',').map((it) => `${Math.round(Number(it || 0) * 100)}%`)
}
