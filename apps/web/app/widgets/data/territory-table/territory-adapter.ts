import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GAMEMODES } from '@nw-data/generated'
import { Observable } from 'rxjs'
import { NwDataService } from '~/data'

import { NwTextContextService } from '~/nw/expression'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridAdapterOptions,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'

import {
  TerritoryRecord,
  territoryColIcon,
  territoryColLootTags,
  territoryColName,
  territoryColRecommendedLevel,
} from './territory-cols'

@Injectable()
export class TerritoryTableAdapter implements TableGridAdapter<TerritoryRecord>, DataViewAdapter<TerritoryRecord> {
  private db = inject(NwDataService)
  private ctx = inject(NwTextContextService)
  private utils: TableGridUtils<TerritoryRecord> = inject(TableGridUtils)
  private config: TableGridAdapterOptions<TerritoryRecord> = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private source$: Observable<TerritoryRecord[]> = selectStream(this.config?.source || this.db.territories, (modes) => {
    if (this.config?.filter) {
      modes = modes.filter(this.config.filter)
    }
    if (this.config?.sort) {
      modes = [...modes].sort(this.config.sort)
    }
    return modes
  })
  public entityID(item: TerritoryRecord): number {
    return item.TerritoryID
  }

  public entityCategories(item: TerritoryRecord): DataTableCategory[] {
    return null
  }

  public gridOptions(): GridOptions<TerritoryRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildGameModeTableOptions(this.utils, this.ctx)
  }

  public virtualOptions(): VirtualGridOptions<TerritoryRecord> {
    return null // PerkGridCellComponent.buildGridOptions()
  }

  public connect() {
    return this.source$
  }
}

export function buildGameModeTableOptions(util: TableGridUtils<TerritoryRecord>, ctx: NwTextContextService) {
  const result: GridOptions<TerritoryRecord> = {
    columnDefs: [
      territoryColIcon(util),
      territoryColName(util),
      territoryColLootTags(util),
      territoryColRecommendedLevel(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_GAMEMODES,
  })
  return result
}
