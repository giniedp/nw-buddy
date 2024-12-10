import { GridOptions } from '@ag-grid-community/core'
import { chain } from 'lodash'
import { combineLatest, from, map, Observable } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { CreatureCategoryCellComponent, CreatureCategoryRecord } from './creature-category-cell.component'

export class CreatureCategoryPickerAdapter implements DataViewAdapter<CreatureCategoryRecord> {
  private db = injectNwData()

  public entityID(item: CreatureCategoryRecord): string | number {
    return item.CategoryID.toLowerCase()
  }
  public entityCategories(item: CreatureCategoryRecord): DataViewCategory[] {
    return null
  }
  public connect(): Observable<CreatureCategoryRecord[]> {
    const categories$ = from(this.db.vitalsAll()).pipe(
      map((list) =>
        chain(list)
          .map((it) => it.VitalsCategories)
          .flatten()
          .sort()
          .uniq()
          .filter((it) => !!it)
          .value(),
      ),
    )
    return combineLatest({
      categoriesMap: this.db.vitalsCategoriesByIdMap(),
      categories: categories$,
    }).pipe(
      map(({ categoriesMap, categories }) => {
        return categories.map((id): CreatureCategoryRecord => {
          return {
            CategoryID: id.toLowerCase(),
            DisplayName: id,
          }
        })
      }),
    )
  }

  public gridOptions(): GridOptions<CreatureCategoryRecord> {
    return null
  }
  public virtualOptions(): VirtualGridOptions<CreatureCategoryRecord> {
    return CreatureCategoryCellComponent.buildGridOptions()
  }
}
