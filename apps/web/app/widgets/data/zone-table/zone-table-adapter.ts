import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { Areadefinitions, COLS_AREADEFINITIONS, COLS_POIDEFINITION, COLS_TERRITORYDEFINITIONS, PoiDefinition } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  addGenericColumns,
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridAdapterOptions,
  TableGridUtils,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  zoneColDescription,
  zoneColGroupSize,
  zoneColIcon,
  zoneColLevelRange,
  zoneColLootTags,
  zoneColName,
  zoneColVitalsCategory,
  ZoneTableRecord,
} from './zone-table-cols'

@Injectable()
export class ZoneTableAdapter implements DataViewAdapter<ZoneTableRecord>, TableGridAdapter<ZoneTableRecord> {
  private db = inject(NwDbService)
  private utils: TableGridUtils<ZoneTableRecord> = inject(TableGridUtils)
  private config = inject<TableGridAdapterOptions<ZoneTableRecord>>(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: ZoneTableRecord): string | number {
    return String(item.TerritoryID)
  }

  public entityCategories(item: ZoneTableRecord): DataTableCategory[] {
    if ((item as Areadefinitions).IsArea) {
      return [
        {
          id: 'area',
          label: 'Area',
        },
      ]
    }
    if (item.IsPOI) {
      return [
        {
          id: 'poi',
          label: 'POI',
        },
      ]
    }
    return [
      {
        id: 'territory',
        label: 'Territory',
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
    return (
      this.config?.source ||
      combineLatest([this.db.pois, this.db.areas, this.db.territories]).pipe(map((list) => list.flat()))
    )
  }
}

function buildPoiTableOptions(util: TableGridUtils<ZoneTableRecord>) {
  const result: GridOptions<ZoneTableRecord> = {
    columnDefs: [
      zoneColIcon(util),
      zoneColName(util),
      zoneColDescription(util),
      zoneColGroupSize(util),
      zoneColLootTags(util),
      zoneColLevelRange(util),
      zoneColVitalsCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_POIDEFINITION,
  })
  addGenericColumns(result, {
    props: COLS_TERRITORYDEFINITIONS,
  })
  addGenericColumns(result, {
    props: COLS_AREADEFINITIONS,
  })
  return result
}
