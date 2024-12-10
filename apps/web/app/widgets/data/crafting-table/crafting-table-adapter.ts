import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getCraftingIngredients, getItemId, getItemIdFromRecipe, getTradeSkillLabel } from '@nw-data/common'
import { COLS_CRAFTINGRECIPEDATA } from '@nw-data/generated'
import { Observable, combineLatest, map } from 'rxjs'
import { CharacterStore, injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  CraftingIngredient,
  CraftingTableRecord,
  craftingColBookmark,
  craftingColCanCraft,
  craftingColCategory,
  craftingColCooldownCeconds,
  craftingColCooldownQuantity,
  craftingColExpansion,
  craftingColFilterText,
  craftingColGroup,
  craftingColHasYieldBonus,
  craftingColID,
  craftingColIcon,
  craftingColInStock,
  craftingColIngredients,
  craftingColItemChance,
  craftingColName,
  craftingColPrice,
  craftingColRecipeLevel,
  craftingColSource,
  craftingColStandingEXP,
  craftingColStation,
  craftingColTradeskill,
  craftingColTradeskillEXP,
} from './crafting-table-cols'

@Injectable()
export class CraftingTableAdapter implements DataViewAdapter<CraftingTableRecord> {
  private db = injectNwData()
  private character = inject(CharacterStore)
  private utils: TableGridUtils<CraftingTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<CraftingTableRecord>({ optional: true })

  public entityID(item: CraftingTableRecord): string {
    return item.RecipeID.toLowerCase()
  }

  public entityCategories(item: CraftingTableRecord): DataTableCategory[] {
    if (!item.Tradeskill) {
      return null
    }
    return [
      {
        id: item.Tradeskill.toLowerCase(),
        label: getTradeSkillLabel(item.Tradeskill),
        icon: '',
      },
    ]
  }

  public gridOptions(): GridOptions<CraftingTableRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils, this.character)
  }

  public virtualOptions(): VirtualGridOptions<CraftingTableRecord> {
    // TODO: add virtual grid support
    return null
  }

  public connect(): Observable<CraftingTableRecord[]> {
    return combineLatest({
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
      recipes: this.db.recipesAll(),
      events: this.db.gameEventsByIdMap(),
      categoriesMap: this.db.craftingCategoriesByIdMap(),
      stationsMap: this.db.stationTypesMetaMap(),
    }).pipe(
      map(({ items, housing, recipes, events, categoriesMap, stationsMap }) => {
        recipes = recipes.filter((it) => !!it.ItemID)
        return recipes.map<CraftingTableRecord>((it) => {
          const itemId = getItemIdFromRecipe(it)
          const stations: CraftingTableRecord['$stations'] = []
          for (const stationId of [it.StationType1, it.StationType2, it.StationType3]) {
            if (!stationId) {
              continue
            }
            const station = stationsMap.get(stationId)?.stations?.[0]
            stations.push(
              station || {
                stationID: stationId,
                name: stationId,
              },
            )
          }
          return {
            ...it,
            $gameEvent: events.get(it.GameEventID),
            $item: items.get(itemId) || housing.get(itemId),
            $stations: stations,
            $ingredients: getCraftingIngredients(it)
              .map((ingr): CraftingIngredient => {
                if (ingr.type === 'Item') {
                  const item = items.get(ingr.ingredient) || housing.get(ingr.ingredient)
                  return {
                    itemId: getItemId(item),
                    categoryId: null,
                    label: item?.Name,
                    icon: item?.IconPath,
                  }
                }
                if (ingr.type === 'Category_Only') {
                  const category = categoriesMap.get(ingr.ingredient)
                  return {
                    itemId: null,
                    categoryId: category?.CategoryID,
                    label: category?.DisplayText,
                    icon: category?.ImagePath,
                  }
                }
                return null
              })
              .filter((it) => !!it),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<CraftingTableRecord>, char: CharacterStore) {
  const result: GridOptions<CraftingTableRecord> = {
    columnDefs: [
      craftingColIcon(util),
      craftingColName(util),
      craftingColID(util),
      craftingColIngredients(util),
      craftingColTradeskill(util),
      craftingColSource(util),
      craftingColBookmark(util),
      craftingColInStock(util),
      craftingColPrice(util),
      craftingColCategory(util),
      craftingColGroup(util),
      craftingColRecipeLevel(util),
      craftingColCanCraft(util, char),
      craftingColHasYieldBonus(util),
      craftingColTradeskillEXP(util),
      craftingColStandingEXP(util),
      craftingColStation(util),
      craftingColExpansion(util),
      craftingColItemChance(util),
      craftingColCooldownQuantity(util),
      craftingColCooldownCeconds(util),
      craftingColFilterText(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_CRAFTINGRECIPEDATA,
  })
  return result
}
