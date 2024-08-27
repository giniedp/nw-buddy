import { GridOptions } from '@ag-grid-community/core'
import { inject } from '@angular/core'
import { chain } from 'lodash'
import { Observable, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import { LootTagCellComponent, LootTagRecord } from './loot-tag-cell.component'

export class LootTagPickerAdapter implements DataViewAdapter<LootTagRecord> {
  private db = inject(NwDataService)

  public entityID(item: LootTagRecord): string | number {
    return item.LootTagID.toLowerCase()
  }
  public entityCategories(item: LootTagRecord): DataViewCategory[] {
    return null
  }
  public connect(): Observable<LootTagRecord[]> {
    return this.db.vitals.pipe(
      map((list) =>
        chain(list)
          .map((it) => it.LootTags || [])
          .flatten()
          .sort()
          .uniq()
          .filter((it) => !!it)
          .value(),
      ),
      map((list) =>
        list.map((it): LootTagRecord => {
          return {
            LootTagID: it.toLowerCase(),
            DisplayName: it,
          }
        }),
      ),
    )
  }

  public gridOptions(): GridOptions<LootTagRecord> {
    return null
  }
  public virtualOptions(): VirtualGridOptions<LootTagRecord> {
    return LootTagCellComponent.buildGridOptions()
  }
}
