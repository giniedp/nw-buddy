import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { COLS_POIDEFINITION } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  poiColDescription,
  poiColGroupSize,
  poiColIcon,
  poiColLevelRange,
  poiColLootTags,
  poiColName,
  poiColVitalsCategory,
  PoiGridRecord,
} from './poi-grid-cols'

@Injectable()
export class PoiGridSource extends DataGridSource<PoiGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<PoiGridRecord> = inject(DataGridUtils)

  public override entityID(item: PoiGridRecord): string | number {
    return item.TerritoryID
  }

  public override entityCategories(item: PoiGridRecord): DataGridCategory[] {
    return null
  }

  public override buildOptions(): GridOptions<PoiGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.pois
  }
}

function buildOptions(util: DataGridUtils<PoiGridRecord>) {
  const result: GridOptions<PoiGridRecord> = {
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
