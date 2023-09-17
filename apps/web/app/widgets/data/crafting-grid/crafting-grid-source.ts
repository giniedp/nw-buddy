import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getIngretientsFromRecipe, getItemIdFromRecipe, getTradeSkillLabel } from '@nw-data/common'
import { COLS_ABILITY } from '@nw-data/generated'
import { Observable, combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  CraftingGridRecord,
  craftingColBookmark,
  craftingColCategory,
  craftingColCooldownCeconds,
  craftingColCooldownQuantity,
  craftingColGroup,
  craftingColID,
  craftingColIcon,
  craftingColInStock,
  craftingColIngredients,
  craftingColItemChance,
  craftingColName,
  craftingColPrice,
  craftingColRecipeLevel,
  craftingColTradeskill,
} from './crafting-grid-cols'

@Injectable()
export class CraftingGridSource extends DataGridSource<CraftingGridRecord> {
  private db = inject(NwDbService)
  private utils: DataGridUtils<CraftingGridRecord> = inject(DataGridUtils)
  private config = inject(DataGridSourceOptions, {
    optional: true,
  })

  public override entityID(item: CraftingGridRecord): string {
    return item.RecipeID
  }

  public override entityCategories(item: CraftingGridRecord): DataGridCategory[] {
    if (!item.Tradeskill) {
      return null
    }
    return [
      {
        id: item.Tradeskill,
        label: getTradeSkillLabel(item.Tradeskill),
        icon: '',
      },
    ]
  }

  public override buildOptions(): GridOptions<CraftingGridRecord> {
    const build = this.config?.buildOptions || buildOptions
    return build(this.utils)
  }

  public override connect(): Observable<CraftingGridRecord[]> {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      recipes: this.db.recipes,
    }).pipe(
      map(({ items, housing, recipes }) => {
        recipes = recipes.filter((it) => !!it.Tradeskill)
        return recipes.map<CraftingGridRecord>((it) => {
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
  }
}

function buildOptions(util: DataGridUtils<CraftingGridRecord>) {
  const result: GridOptions<CraftingGridRecord> = {
    columnDefs: [
      craftingColIcon(util),
      craftingColName(util),
      craftingColID(util),
      craftingColIngredients(util),
      craftingColBookmark(util),
      craftingColInStock(util),
      craftingColPrice(util),
      craftingColTradeskill(util),
      craftingColCategory(util),
      craftingColGroup(util),
      craftingColRecipeLevel(util),
      craftingColItemChance(util),
      craftingColCooldownQuantity(util),
      craftingColCooldownCeconds(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ABILITY,
  })
  return result
}
