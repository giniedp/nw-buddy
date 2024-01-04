import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getCraftingIngredients, getItemIdFromRecipe, getItemTierAsRoman } from '@nw-data/common'
import { Crafting, ItemDefinitionMaster } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { combineLatest } from 'rxjs'
import { RecipeCellComponent } from './recipes-cell.component'
import { RecipeRecord } from './types'

@Injectable()
export class RecipesTableAdapter implements TableGridAdapter<RecipeRecord>, DataViewAdapter<RecipeRecord> {
  private db = inject(NwDbService)

  public entityID(item: RecipeRecord): string {
    return item.itemId
  }

  public entityCategories(record: RecipeRecord): DataTableCategory[] {
    return [
      {
        id: 'T' + String(record.recipeItem.Tier),
        label: getItemTierAsRoman(record.recipeItem.Tier),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<RecipeRecord> {
    return RecipeCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<RecipeRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    combineLatest({
      items: this.db.itemsMap,
      recipes: this.db.recipes,
    }),
    selectRecords
  )
}

function isRecipe(item: ItemDefinitionMaster) {
  return item.TradingGroup === 'Recipes'
}

function selectRecords({ items, recipes }: { items: Map<string, ItemDefinitionMaster>; recipes: Crafting[] }) {
  return recipes
    .map((recipe): RecipeRecord => {
      const itemId = getItemIdFromRecipe(recipe)
      const item = items.get(itemId)
      if (!item) {
        return null
      }
      const recipeItem = items.get(recipe.RequiredAchievementID)
      if (!recipeItem || !isRecipe(recipeItem)) {
        return null
      }
      return {
        item: item,
        itemId: itemId,
        recipeItem: recipeItem,
        recipe: recipe,
        ingredients: getCraftingIngredients(recipe).map((it) => {
          return {
            quantity: it.quantity,
            item: items.get(it.ingredient),
            itemId: it.ingredient,
          }
        }),
      }
    })
    .filter((it) => !!it)
}
