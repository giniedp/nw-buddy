import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { getItemIdFromRecipe, getItemTierAsRoman } from '@nw-data/common'
import { CraftingRecipeData, MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { sortBy } from 'lodash'
import { combineLatest } from 'rxjs'
import { TranslateService } from '~/i18n'
import { RecipeCellComponent } from './recipes-cell.component'
import { RecipeRecord } from './types'

@Injectable()
export class RecipesTableAdapter implements DataViewAdapter<RecipeRecord> {
  private db = injectNwData()
  private tl8 = inject(TranslateService)

  public entityID(item: RecipeRecord): string {
    return item.itemId.toLowerCase()
  }

  public entityCategories(record: RecipeRecord): DataTableCategory[] {
    return [
      {
        id: ('T' + String(record.recipeItem.Tier)).toLowerCase(),
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
      items: this.db.itemsByIdMap(),
      recipes: this.db.recipesAll(),
    }),
    (data) => {
      return sortBy(selectRecords(data), (it) => this.tl8.get(it.item.Name))
    },
  )
}

function isRecipe(item: MasterItemDefinitions) {
  return item.TradingGroup === 'Recipes'
}

function selectRecords({
  items,
  recipes,
}: {
  items: Map<string, MasterItemDefinitions>
  recipes: CraftingRecipeData[]
}) {
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
      }
    })
    .filter((it) => !!it)
}
