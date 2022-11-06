import { Injectable } from '@angular/core'
import { Housingitems } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of, shareReplay } from 'rxjs'
import { GearsetsDB, GearsetRecord } from '~/data'
import { TranslateService } from '~/i18n'
import { NwService } from '~/nw'
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
