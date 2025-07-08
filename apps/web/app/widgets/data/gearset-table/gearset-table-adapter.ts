import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { Observable, of } from 'rxjs'
import { GearsetRow } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { GearsetLoadoutComponent } from '../gearset-detail'
import {
  GearsetTableRecord,
  gearsetColGearScore,
  gearsetColName,
  gearsetColSlots,
  gearsetColWeight,
} from './gearset-table-cols'

@Injectable()
export class GearsetTableAdapter implements DataViewAdapter<GearsetTableRecord> {
  private config = injectDataViewAdapterOptions<GearsetTableRecord>({ optional: true })
  private utils: TableGridUtils<GearsetTableRecord> = inject(TableGridUtils)

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
    return GearsetLoadoutComponent.buildGridOptions()
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

  private source$: Observable<GearsetRow[]> = this.config?.source || of<GearsetRow[]>([])
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
