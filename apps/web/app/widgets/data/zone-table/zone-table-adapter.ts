import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { COLS_TERRITORYDEFINITION } from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { addGenericColumns, DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import {
  zoneColDescription,
  zoneColIcon,
  zoneColLevelRange,
  zoneColLootTags,
  zoneColName,
  zoneColVitalsCategory,
  ZoneTableRecord,
} from './zone-table-cols'

@Injectable()
export class ZoneTableAdapter implements DataViewAdapter<ZoneTableRecord> {
  private db = injectNwData()
  private utils: TableGridUtils<ZoneTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<ZoneTableRecord>({ optional: true })

  public entityID(item: ZoneTableRecord): string | number {
    return String(item.TerritoryID)
  }

  public entityCategories(item: ZoneTableRecord): DataTableCategory[] {
    let source = item.$source
    if (!source) {
      return []
    }
    if (source.startsWith('PointsOfInterest')) {
      source = 'PointsOfInterest'
    }
    if (source.endsWith('Definitions')) {
      source = source.replace('Definitions', '')
    }
    return [
      {
        id: source,
        label: humanize(source),
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<ZoneTableRecord> {
    return null
  }
  public gridOptions(): GridOptions<ZoneTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildPoiTableOptions(this.utils)
  }

  public connect() {
    return this.config?.source || from(this.db.territoriesAll())
  }
}

function buildPoiTableOptions(util: TableGridUtils<ZoneTableRecord>) {
  const result: GridOptions<ZoneTableRecord> = {
    columnDefs: [
      zoneColIcon(util),
      zoneColName(util),
      zoneColDescription(util),
      zoneColLootTags(util),
      zoneColLevelRange(util),
      zoneColVitalsCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_TERRITORYDEFINITION,
  })
  return result
}
