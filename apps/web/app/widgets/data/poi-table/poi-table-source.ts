import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { COLS_POIDEFINITION } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataTableSource, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
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
export class PoiTableSource extends DataTableSource<PoiTableRecord> {
  private db = inject(NwDbService)
  private utils: DataTableUtils<PoiTableRecord> = inject(DataTableUtils)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })

  public override entityID(item: PoiTableRecord): string | number {
    return item.TerritoryID
  }

  public override entityCategories(item: PoiTableRecord): DataTableCategory[] {
    return null
  }

  public override gridOptions(): GridOptions<PoiTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildPoiTableOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.pois
  }
}

function buildPoiTableOptions(util: DataTableUtils<PoiTableRecord>) {
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
