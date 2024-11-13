import { GridOptions } from '@ag-grid-community/core'
import { Injectable } from '@angular/core'
import { getItemId, getRecipeForItem } from '@nw-data/common'
import { CraftingRecipeData, HouseItems } from '@nw-data/generated'
import { injectNwData } from '~/data'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { groupBy, sortBy } from 'lodash'
import { combineLatest } from 'rxjs'
import { TrophiesCellComponent } from './trophies-cell.component'
import { TrophiesRecord } from './types'

@Injectable()
export class TrophiesTableAdapter implements DataViewAdapter<TrophiesRecord> {
  private db = injectNwData()

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
      recipes: this.db.recipesByItemIdMap(),
      trophies: this.db.housingItemsAll().then((it) => it.filter(isTrophyItem)),
    }),
    selectRecords,
  )
}

function isTrophyItem(item: HouseItems) {
  return item.HousingTags?.includes('IsTrophyBuff')
}

function selectRecords({ recipes, trophies }: { recipes: Map<string, CraftingRecipeData[]>; trophies: HouseItems[] }) {
  const records = trophies.map((housing): TrophiesRecord => {
    return {
      itemId: getItemId(housing),
      item: housing,
      recipe: getRecipeForItem(housing, recipes),
    }
  })

  return Object.values(
    groupBy(
      sortBy(records, (it) => it.itemId),
      (it) => it.itemId.replace(/_T\d$/, ''),
    ),
  )
    .sort((a, b) => b.length - a.length)
    .flat()
    .filter((it) => !it.itemId.endsWith('_T0'))
}
