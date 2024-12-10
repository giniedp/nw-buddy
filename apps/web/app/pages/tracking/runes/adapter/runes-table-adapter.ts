import { GridOptions } from '@ag-grid-community/core'
import { Injectable } from '@angular/core'
import { getItemIdFromRecipe } from '@nw-data/common'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { groupBy } from 'lodash'
import { combineLatest } from 'rxjs'
import { RunesCellComponent } from './runes-cell.component'
import { RunesRecord } from './types'

@Injectable()
export class RunesTableAdapter implements DataViewAdapter<RunesRecord> {
  private db = injectNwData()

  public entityID(item: RunesRecord): string {
    return item.itemId.toLowerCase()
  }

  public entityCategories(item: RunesRecord): DataTableCategory[] {
    const tradeskill = item?.recipe?.Tradeskill
    if (!tradeskill) {
      return null
    }
    return [
      {
        id: tradeskill.toLowerCase(),
        label: tradeskill,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<RunesRecord> {
    return RunesCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<RunesRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    combineLatest({
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
      recipes: this.db.recipesAll().then((it) => it.filter(isRunestone)),
    }),
    selectSchematics,
  )
}

function isRunestone(it: CraftingRecipeData) {
  return (
    it.Tradeskill === 'Stonecutting' &&
    (it.CraftingGroup === 'Rune' || it.CraftingGroup?.startsWith('UniqueDungeonReps'))
  )
}

function selectSchematics({
  recipes,
  items,
  housing,
}: {
  recipes: CraftingRecipeData[]
  items: Map<string, MasterItemDefinitions>
  housing: Map<string, HouseItems>
}) {
  const runes = recipes
    .map((recipe): RunesRecord => {
      const itemId = getItemIdFromRecipe(recipe)
      return {
        recipe,
        itemId: itemId,
        item: items.get(itemId) || housing.get(itemId),
      }
    })
    .filter((it) => !!it)

  const groups = groupBy(runes, (it) => it.itemId.replace(/T[0-9][a-zA-Z]?$/i, ''))
  return Array.from(Object.values(groups)).flat()
}
