import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getCraftingIngredients, getItemId, getRecipeForItem } from '@nw-data/common'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { groupBy, sortBy } from 'lodash'
import { combineLatest, map } from 'rxjs'
import { TrophiesCellComponent } from './trophies-cell.component'
import { TrophiesRecord } from './types'

@Injectable()
export class TrophiesTableAdapter implements TableGridAdapter<TrophiesRecord>, DataViewAdapter<TrophiesRecord> {
  private db = inject(NwDataService)

  public entityID(item: TrophiesRecord): string {
    return item.itemId
  }

  public entityCategories(item: TrophiesRecord): DataTableCategory[] {
    return null
  }

  public virtualOptions(): VirtualGridOptions<TrophiesRecord> {
    return TrophiesCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<TrophiesRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    combineLatest({
      recipes: this.db.recipesMapByItemId,
      trophies: this.db.housingItems.pipe(map((it) => it.filter(isTrophyItem))),
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
    }),
    selectRecords
  )
}

function isTrophyItem(item: Housingitems) {
  return item.HousingTags?.includes('IsTrophyBuff')
}

function selectRecords({
  recipes,
  trophies,
  itemsMap,
  housingMap,
}: {
  recipes: Map<string, Crafting[]>
  trophies: Housingitems[]
  itemsMap: Map<string, ItemDefinitionMaster>
  housingMap: Map<string, Housingitems>
}) {
  const records = trophies.map((housing): TrophiesRecord => {
    const recipe = getRecipeForItem(housing, recipes)
    const ingredients = getCraftingIngredients(recipe).map((it) => {
      return {
        quantity: it.quantity,
        item: itemsMap.get(it.ingredient) || housingMap.get(it.ingredient),
        itemId: it.ingredient,
      }
    })

    return {
      itemId: getItemId(housing),
      item: housing,
      recipe: recipe,
      ingredients: ingredients,
    }
  })

  return Object.values(
    groupBy(
      sortBy(records, (it) => it.itemId),
      (it) => it.itemId.replace(/_T\d$/, '')
    )
  )
    .sort((a, b) => b.length - a.length)
    .flat()
    .filter((it) => !it.itemId.endsWith('_T0'))
}
