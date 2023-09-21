import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTTABLE } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  LootTableGridRecord,
  lootTableColConditions,
  lootTableColId,
  lootTableColMaxRoll,
  lootTableColName,
  lootTableColParents,
  lootTableColSource,
} from './loot-table-cols'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'

@Injectable()
export class LootTableAdapter implements DataViewAdapter<LootTableGridRecord>, DataGridAdapter<LootTableGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<LootTableGridRecord> = inject(DataTableUtils)

  public entityID(item: LootTableGridRecord): string {
    return item.LootTableID
  }

  public entityCategories(item: LootTableGridRecord): DataTableCategory[] {
    if (!item.$parents?.length) {
      return [
        {
          icon: null,
          label: 'Roots',
          id: 'roots',
        },
      ]
    }
    return [
      {
        icon: null,
        label: 'Children',
        id: 'children',
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

function buildOptions(util: DataTableUtils<LootTableGridRecord>) {
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
    props: COLS_LOOTTABLE,
  })
  return result
}
