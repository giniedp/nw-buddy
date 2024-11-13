import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { getItemIdFromRecipe } from '@nw-data/common'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { sortBy } from 'lodash'
import { combineLatest } from 'rxjs'
import { SchematicCellComponent } from './schematic-cell.component'
import { SchematicRecord } from './types'

@Injectable()
export class SchematicsTableAdapter implements DataViewAdapter<SchematicRecord> {
  private db = injectNwData()
  private tl8 = inject(TranslateService)
  private config = injectDataViewAdapterOptions<SchematicRecord>({ optional: true })

  public entityID(item: SchematicRecord): string {
    return item.itemId.toLowerCase()
  }

  public entityCategories(item: SchematicRecord): DataTableCategory[] {
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
      locale: this.tl8.locale.value$,
      items: this.db.itemsByIdMap(),
      itemsBySalvage: this.db.itemsBySalvageAchievementMap(),
      housingItems: this.db.housingItemsByIdMap(),
      recipes: this.db.recipesAll(),
    }),
    (data) => {
      return sortBy(selectSchematics(data), (it) => this.tl8.get(it.item.Name))
    },
  )
}

function isSchematic(item: MasterItemDefinitions) {
  return item.ItemClass?.includes('WeaponSchematic') || item.ItemClass?.includes('FurnitureSchematic')
}

function selectSchematics({
  recipes,
  items,
  itemsBySalvage,
  housingItems,
}: {
  recipes: CraftingRecipeData[]
  items: Map<string, MasterItemDefinitions>
  itemsBySalvage: Map<string, MasterItemDefinitions[]>
  housingItems: Map<string, HouseItems>
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
      }
    })
    .filter((it) => !!it)
}
