import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getCraftingIngredients, getItemIdFromRecipe, getItemTierAsRoman } from '@nw-data/common'
import { CraftingRecipeData, MasterItemDefinitions } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { combineLatest } from 'rxjs'
import { RecipeCellComponent } from './recipes-cell.component'
import { RecipeRecord } from './types'
import { TranslateService } from '~/i18n'
import { sortBy } from 'lodash'

@Injectable()
export class RecipesTableAdapter implements TableGridAdapter<RecipeRecord>, DataViewAdapter<RecipeRecord> {
  private db = inject(NwDataService)
  private tl8 = inject(TranslateService)

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
      locale: this.tl8.locale.value$,
      items: this.db.itemsMap,
      recipes: this.db.recipes,
    }),
    (data) => {
      return sortBy(selectRecords(data), (it) => this.tl8.get(it.item.Name))
    }
  )
}

function isRecipe(item: MasterItemDefinitions) {
  return item.TradingGroup === 'Recipes'
}

function selectRecords({ items, recipes }: { items: Map<string, MasterItemDefinitions>; recipes: CraftingRecipeData[] }) {
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
