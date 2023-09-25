import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getIngretientsFromRecipe, getItemId, getItemIdFromRecipe } from '@nw-data/common'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { mapFilter, selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { combineLatest } from 'rxjs'
import { RunesCellComponent } from './runes-cell.component'
import { RunesRecord } from './types'
import { groupBy } from 'lodash'

@Injectable()
export class RunesTableAdapter implements TableGridAdapter<RunesRecord>, DataViewAdapter<RunesRecord> {
  private db = inject(NwDbService)

  public entityID(item: RunesRecord): string {
    return item.itemId
  }

  public entityCategories(item: RunesRecord): DataTableCategory[] {
    const tradeskill = item?.recipe?.Tradeskill
    if (!tradeskill) {
      return null
    }
    return [
      {
        id: tradeskill,
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
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      recipes: this.db.recipes.pipe(mapFilter(isRunestone)),
    }),
    selectSchematics
  )
}

function isRunestone(it: Crafting) {
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
  recipes: Crafting[]
  items: Map<string, ItemDefinitionMaster>
  housing: Map<string, Housingitems>
}) {
  const runes = recipes
    .map((recipe): RunesRecord => {
      const itemId = getItemIdFromRecipe(recipe)
      return {
        recipe,
        itemId: itemId,
        item: items.get(itemId) || housing.get(itemId),
        ingredients: getIngretientsFromRecipe(recipe).map((it) => {
          const item = items.get(it.ingredient) || housing.get(it.ingredient)
          return {
            quantity: it.quantity,
            item: items.get(it.ingredient) || housing.get(it.ingredient),
            itemId: getItemId(item),
          }
        }),
      }
    })
    .filter((it) => !!it)

  const groups = groupBy(runes, (it) => it.itemId.replace(/T[0-9][a-zA-Z]?$/i, ''))
  return Array.from(Object.values(groups)).flat()
}
