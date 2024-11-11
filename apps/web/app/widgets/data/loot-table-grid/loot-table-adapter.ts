import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTTABLESDATA } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import {
  LootTableGridRecord,
  lootTableColConditions,
  lootTableColId,
  lootTableColMaxRoll,
  lootTableColName,
  lootTableColParents,
  lootTableColSource,
} from './loot-table-cols'
import { from } from 'rxjs'

@Injectable()
export class LootTableAdapter implements DataViewAdapter<LootTableGridRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<LootTableGridRecord>({ optional: true })
  private utils: TableGridUtils<LootTableGridRecord> = inject(TableGridUtils)

  public entityID(item: LootTableGridRecord): string {
    return item.LootTableID.toLowerCase()
  }

  public entityCategories(item: LootTableGridRecord): DataTableCategory[] {
    if (!item.$source) {
      return null
    }
    const source = item.$source.replace('LootTables', '') || 'Common'
    return [
      {
        id: source.toLowerCase(),
        label: humanize(source),
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
    return this.config?.source || from(this.db.lootTablesAll().then(selectTables))
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
