import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTTABLESDATA } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  LootTableGridRecord,
  lootTableColConditions,
  lootTableColId,
  lootTableColMaxRoll,
  lootTableColName,
  lootTableColParents,
  lootTableColSource,
} from './loot-table-cols'
import { humanize } from '~/utils'

@Injectable()
export class LootTableAdapter implements DataViewAdapter<LootTableGridRecord>, TableGridAdapter<LootTableGridRecord> {
  private db = inject(NwDataService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<LootTableGridRecord> = inject(TableGridUtils)

  public entityID(item: LootTableGridRecord): string {
    return item.LootTableID
  }

  public entityCategories(item: LootTableGridRecord): DataTableCategory[] {
    if (!item.$source) {
      return null
    }
    return [
      {
        id: item.$source,
        label: humanize(item.$source),
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<LootTableGridRecord> {
    return null
  }
  public gridOptions(): GridOptions<LootTableGridRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.lootTables.pipe(map(selectTables))
  }
}

function selectTables(tables: LootTableGridRecord[]) {
  const entries = tables.map((it): LootTableGridRecord => {
    return {
      ...it,
      $parents: null,
    }
  })
  const entryMap = new Map(entries.map((it) => [it.LootTableID, it]))

  for (const parent of entries) {
    for (const item of parent.Items) {
      if (item.LootTableID) {
        const child = entryMap.get(item.LootTableID)
        if (child) {
          child.$parents = child.$parents || []
          child.$parents.push(parent.LootTableID)
        }
      }
    }
  }
  return entries
}

function buildOptions(util: TableGridUtils<LootTableGridRecord>) {
  const result: GridOptions<LootTableGridRecord> = {
    columnDefs: [
      lootTableColId(util),
      lootTableColName(util),
      lootTableColSource(util),
      lootTableColConditions(util),
      lootTableColMaxRoll(util),
      lootTableColParents(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_LOOTTABLESDATA,
  })
  return result
}
