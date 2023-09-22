import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { Observable, Subject, defer, filter, take } from 'rxjs'
import { GearsetRow, GearsetsStore } from '~/data'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableAdapterOptions } from '~/ui/data-table'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
import { shareReplayRefCount } from '~/utils'
import {
  GearsetTableRecord,
  gearsetColGearScore,
  gearsetColName,
  gearsetColSlots,
  gearsetColWeight,
} from './gearset-table-cols'

@Injectable()
export class GearsetTableAdapter implements DataGridAdapter<GearsetTableRecord>, DataViewAdapter<GearsetTableRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<GearsetTableRecord> = inject(DataTableUtils)
  private store = inject(GearsetsStore)

  public entityID(item: GearsetRow): string {
    return item.record.id
  }

  public entityCategories(item: GearsetRow) {
    return null
  }

  public virtualOptions(): VirtualGridOptions<GearsetTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<GearsetTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonGearsetGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$: Observable<GearsetRow[]> = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))
    .pipe(shareReplayRefCount(1))

  // public override transaction: Observable<RowDataTransaction> = defer(() => {
  //   return merge(
  //     this.store.rowCreated$.pipe(switchMap((item) => this.txInsert([item]))),
  //     this.store.rowUpdated$.pipe(switchMap((item) => this.txUpdate([item]))),
  //     this.store.rowDestroyed$.pipe(switchMap((recordId) => this.txRemove([recordId])))
  //   )
  // })
}

export function buildCommonGearsetGridOptions(util: DataTableUtils<GearsetTableRecord>) {
  const result: GridOptions<GearsetTableRecord> = {
    getRowId: ({ data }) => (data as GearsetTableRecord).record.id,
    columnDefs: [
      gearsetColName(util),
      gearsetColWeight(util),
      gearsetColGearScore(util),
      gearsetColSlots(util),
      // gearsetColActions
    ],
  }
  return result
}
