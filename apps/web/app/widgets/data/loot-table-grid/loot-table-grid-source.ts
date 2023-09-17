import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTTABLE } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  LootTableGridRecord,
  lootTableColConditions,
  lootTableColId,
  lootTableColMaxRoll,
  lootTableColName,
  lootTableColParents,
  lootTableColSource,
} from './loot-table-grid-cols'

@Injectable()
export class LootTableGridSource extends DataGridSource<LootTableGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<LootTableGridRecord> = inject(DataGridUtils)

  public override entityID(item: LootTableGridRecord): string {
    return item.LootTableID
  }

  public override entityCategories(item: LootTableGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<LootTableGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
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

function buildOptions(util: DataGridUtils<LootTableGridRecord>) {
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
