import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_PVPRANKDATA } from '@nw-data/generated'
import { Observable } from 'rxjs'
import { NwDataService } from '~/data'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  PvpRankTableRecord,
  pvpRankColDescription,
  pvpRankColGameEvent,
  pvpRankColLevel,
  pvpRankColName,
} from './pvp-rank-table-cols'

@Injectable()
export class PvpRankTableAdapter implements DataViewAdapter<PvpRankTableRecord>, TableGridAdapter<PvpRankTableRecord> {
  private db = inject(NwDataService)
  private utils: TableGridUtils<PvpRankTableRecord> = inject(TableGridUtils)
  private weaponTypes: NwWeaponTypesService = inject(NwWeaponTypesService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: PvpRankTableRecord): string {
    return String(item.Level)
  }

  public entityCategories(item: PvpRankTableRecord): DataTableCategory[] {
    return null
  }

  public virtualOptions(): VirtualGridOptions<PvpRankTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<PvpRankTableRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils)
  }

  public connect(): Observable<PvpRankTableRecord[]> {
    return this.db.pvpRanks
  }
}

function buildOptions(util: TableGridUtils<PvpRankTableRecord>) {
  const result: GridOptions<PvpRankTableRecord> = {
    columnDefs: [pvpRankColLevel(util), pvpRankColName(util), pvpRankColDescription(util), pvpRankColGameEvent(util)],
  }
  addGenericColumns(result, {
    props: COLS_PVPRANKDATA,
    defaults: {
      hide: false
    }
  })
  return result
}
