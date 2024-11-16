import { GridOptions } from '@ag-grid-community/core'
import { Injectable, Signal, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getCraftingIngredients, getItemIdFromRecipe, getTradeSkillLabel } from '@nw-data/common'
import { COLS_CRAFTINGRECIPEDATA } from '@nw-data/generated'
import { Observable, combineLatest, map } from 'rxjs'
import { CharacterStore, injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  CraftingTableRecord,
  craftingColBookmark,
  craftingColCanCraft,
  craftingColCategory,
  craftingColCooldownCeconds,
  craftingColCooldownQuantity,
  craftingColCraftingXP,
  craftingColExpansion,
  craftingColGroup,
  craftingColID,
  craftingColIcon,
  craftingColInStock,
  craftingColIngredients,
  craftingColItemChance,
  craftingColName,
  craftingColPrice,
  craftingColRecipeLevel,
  craftingColSource,
  craftingColTradeskill,
} from './crafting-table-cols'

@Injectable()
export class CraftingTableAdapter implements DataViewAdapter<CraftingTableRecord> {
  private db = injectNwData()
  private character = inject(CharacterStore)
  private utils: TableGridUtils<CraftingTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<CraftingTableRecord>({ optional: true })
  private skills = toSignal(this.character.tradeskills$, { initialValue: null })

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
    return build(this.utils, this.skills)
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
    }).pipe(
      map(({ items, housing, recipes, events }) => {
        recipes = recipes.filter((it) => !!it.ItemID)
        return recipes.map<CraftingTableRecord>((it) => {
          const itemId = getItemIdFromRecipe(it)
          return {
            ...it,
            $gameEvent: events.get(it.GameEventID),
            $item: items.get(itemId) || housing.get(itemId),
            $ingredients: getCraftingIngredients(it)
              .map((ing) => items.get(ing.ingredient) || housing.get(ing.ingredient))
              .filter((it) => !!it),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<CraftingTableRecord>, skills: Signal<Record<string, number>>) {
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
      craftingColCraftingXP(util),
      craftingColCategory(util),
      craftingColGroup(util),
      craftingColRecipeLevel(util),
      craftingColCanCraft(util, skills),
      craftingColExpansion(util),
      craftingColItemChance(util),
      craftingColCooldownQuantity(util),
      craftingColCooldownCeconds(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_CRAFTINGRECIPEDATA,
  })
  return result
}
