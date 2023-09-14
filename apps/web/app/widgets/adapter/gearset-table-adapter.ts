import { Injectable } from '@angular/core'
import { GridOptions } from '@ag-grid-community/core'
import { defer, Observable, of } from 'rxjs'
import { GearsetRecord, GearsetsDB } from '~/data'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class GearsetTableAdapter extends DataTableAdapter<GearsetRecord> {
  public static provider() {
    return dataTableProvider({
      adapter: GearsetTableAdapter,
    })
  }

  public entityID(item: GearsetRecord): string {
    return item.id
  }

  public entityCategory(item: GearsetRecord): string {
    return null
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 300,
          valueGetter: this.valueGetter(({ data }) => data.name),
          getQuickFilterText: ({ value }) => value,
        }),
      ],
    })
  )

  public entities: Observable<GearsetRecord[]> = defer(() => this.db.live((t) => t.toArray())).pipe(
    shareReplayRefCount(1)
  )

  public constructor(private db: GearsetsDB) {
    super()
  }
}
