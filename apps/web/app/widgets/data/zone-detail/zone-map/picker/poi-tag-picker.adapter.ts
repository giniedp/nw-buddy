import { GridOptions } from '@ag-grid-community/core'
import { inject } from '@angular/core'
import { chain } from 'lodash'
import { Observable, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { PoiTagCellComponent, PoiTagRecord } from './poi-tag-cell.component'

export class PoiTagPickerAdapter implements DataViewAdapter<PoiTagRecord> {
  private db = inject(NwDataService)

  public entityID(item: PoiTagRecord): string | number {
    return item.PoiTagID.toLowerCase()
  }
  public entityCategories(item: PoiTagRecord): DataViewCategory[] {
    return null
  }
  public connect(): Observable<PoiTagRecord[]> {
    return this.db.territories.pipe(
      map((list) =>
        chain(list)
          .map((it) => it.POITag || [])
          .flatten()
          .sort()
          .uniq()
          .filter((it) => !!it)
          .value(),
      ),
      map((list) =>
        list.map((it): PoiTagRecord => {
          return {
            PoiTagID: it.toLowerCase(),
            DisplayName: it,
          }
        }),
      ),
    )
  }

  public gridOptions(): GridOptions<PoiTagRecord> {
    return null
  }
  public virtualOptions(): VirtualGridOptions<PoiTagRecord> {
    return PoiTagCellComponent.buildGridOptions()
  }
}
