import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getIngretientsFromRecipe, getItemId, getItemIdFromRecipe } from '@nw-data/common'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { combineLatest } from 'rxjs'
import { SchematicRecord } from './types'
import { SchematicCellComponent } from './schematic-cell.component'

@Injectable()
export class SchematicsTableAdapter implements TableGridAdapter<SchematicRecord>, DataViewAdapter<SchematicRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: SchematicRecord): string {
    return item.itemId
  }

  public entityCategories(item: SchematicRecord): DataTableCategory[] {
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

  public virtualOptions(): VirtualGridOptions<SchematicRecord> {
    return SchematicCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<SchematicRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    combineLatest({
      items: this.db.itemsMap,
      itemsBySalvage: this.db.itemsBySalvageAchievement,
      housingItems: this.db.housingItemsMap,
      recipes: this.db.recipes,
    }),
    selectSchematics
  )
}

function isSchematic(item: ItemDefinitionMaster) {
  return item.ItemClass?.includes('WeaponSchematic') || item.ItemClass?.includes('FurnitureSchematic')
}

function selectSchematics({
  recipes,
  items,
  itemsBySalvage,
  housingItems,
}: {
  recipes: Crafting[]
  items: Map<string, ItemDefinitionMaster>
  itemsBySalvage: Map<string, ItemDefinitionMaster[]>
  housingItems: Map<string, Housingitems>
}) {
  return recipes
    .map((recipe): SchematicRecord => {
      const candidates = itemsBySalvage.get(recipe.RequiredAchievementID)
      const recipeItem = candidates?.find((it) => isSchematic(it))
      if (!recipeItem || !isSchematic(recipeItem)) {
        return null
      }
      const itemId = getItemIdFromRecipe(recipe)
      const item = items.get(itemId) || housingItems.get(itemId)
      if (!item) {
        return null
      }

      return {
        itemId: itemId,
        item: item,
        recipeItem: recipeItem,
        recipe: recipe,
        ingredients: getIngretientsFromRecipe(recipe).map((it) => {
          const item = items.get(it.ingredient) || housingItems.get(it.ingredient)
          return {
            quantity: it.quantity,
            item: items.get(it.ingredient) || housingItems.get(it.ingredient),
            itemId: getItemId(item),
          }
        }),
      }
    })
    .filter((it) => !!it)
}
