import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Observable, filter } from 'rxjs'
import { GearsetRow, GearsetsStore, NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { DataViewAdapter } from '~/ui/data/data-view'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { shareReplayRefCount } from '~/utils'
import { GearsetLoadoutItemComponent } from './gearset-cell.component'
import {
  GearsetTableRecord,
  gearsetColGearScore,
  gearsetColName,
  gearsetColSlots,
  gearsetColWeight,
} from './gearset-table-cols'

@Injectable()
export class GearsetTableAdapter implements TableGridAdapter<GearsetTableRecord>, DataViewAdapter<GearsetTableRecord> {
  private db = inject(NwDataService)
  private i18n = inject(TranslateService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<GearsetTableRecord> = inject(TableGridUtils)
  private store = inject(GearsetsStore)

  public entityID(item: GearsetRow): string {
    return item.record.id
  }

  public entityCategories(item: GearsetRow) {
    if (!item.record.tags?.length) {
      return null
    }
    return item.record.tags.map((tag) => {
      return {
        id: tag,
        label: tag,
      }
    })
  }

  public virtualOptions(): VirtualGridOptions<GearsetTableRecord> {
    return GearsetLoadoutItemComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<GearsetTableRecord> {
    let options: GridOptions<GearsetTableRecord>
    if (this.config?.gridOptions) {
      options = this.config.gridOptions(this.utils)
    } else {
      options = buildCommonGearsetGridOptions(this.utils)
    }
    return options
  }

  public connect() {
    return this.source$
  }

  private source$: Observable<GearsetRow[]> =
    this.config?.source ||
    toObservable(this.store.rows)
      .pipe(filter((it) => it != null))
      .pipe(shareReplayRefCount(1))
}

export function buildCommonGearsetGridOptions(util: TableGridUtils<GearsetTableRecord>) {
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
