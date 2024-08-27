import { GridOptions } from '@ag-grid-community/core'
import { inject } from '@angular/core'
import { chain } from 'lodash'
import { Observable, combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { CreatureCategoryCellComponent, CreatureCategoryRecord } from './creature-category-cell.component'

export class CreatureCategoryPickerAdapter implements DataViewAdapter<CreatureCategoryRecord> {
  private db = inject(NwDataService)

  public entityID(item: CreatureCategoryRecord): string | number {
    return item.CategoryID.toLowerCase()
  }
  public entityCategories(item: CreatureCategoryRecord): DataViewCategory[] {
    return null
  }
  public connect(): Observable<CreatureCategoryRecord[]> {
    const categories$ = this.db.vitals.pipe(
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
      categoriesMap: this.db.vitalsCategoriesMap,
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
