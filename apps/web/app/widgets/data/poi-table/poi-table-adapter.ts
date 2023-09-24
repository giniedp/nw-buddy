import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { COLS_POIDEFINITION, PoiDefinition } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { DataTableCategory } from '~/ui/data/table-grid'
import { addGenericColumns } from '~/ui/data/table-grid'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  poiColDescription,
  poiColGroupSize,
  poiColIcon,
  poiColLevelRange,
  poiColLootTags,
  poiColName,
  poiColVitalsCategory,
  PoiTableRecord,
} from './poi-table-cols'

@Injectable()
export class PoiTableAdapter implements DataViewAdapter<PoiTableRecord>, TableGridAdapter<PoiTableRecord> {
  private db = inject(NwDbService)
  private utils: TableGridUtils<PoiTableRecord> = inject(TableGridUtils)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: PoiTableRecord): string | number {
    return item.TerritoryID
  }

  public entityCategories(item: PoiTableRecord): DataTableCategory[] {
    return null
  }
  public virtualOptions(): VirtualGridOptions<PoiDefinition> {
    return null
  }
  public gridOptions(): GridOptions<PoiTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildPoiTableOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.pois
  }
}

function buildPoiTableOptions(util: TableGridUtils<PoiTableRecord>) {
  const result: GridOptions<PoiTableRecord> = {
    columnDefs: [
      poiColIcon(util),
      poiColName(util),
      poiColDescription(util),
      poiColGroupSize(util),
      poiColLootTags(util),
      poiColLevelRange(util),
      poiColVitalsCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_POIDEFINITION,
  })
  return result
}
