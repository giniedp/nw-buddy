import { Injectable } from '@angular/core'
import { GridOptions } from 'ag-grid-community'
import { Observable, defer, map, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { LootTableEntry } from '~/nw/utils'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

export type TableEntry = LootTableEntry & {
  $parents: string[]
}
@Injectable()
export class LootTableAdapter extends DataTableAdapter<TableEntry> {
  public static provider() {
    return dataTableProvider({
      adapter: LootTableAdapter,
    })
  }

  public entityID(item: TableEntry): string {
    return item.LootTableID
  }

  public entityCategory(item: TableEntry): string {
    return null
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      // suppressRowHoverHighlight: true,
      columnDefs: [
        this.colDef({
          colId: 'id',
          headerValueGetter: () => 'ID',
          width: 200,
          hide: true,
          valueGetter: this.valueGetter(({ data }) => {
            return data.LootTableID
          }),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            return humanize(data.LootTableID)
          }),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'maxRoll',
          headerValueGetter: () => 'Max Roll',
          field: this.fieldName('MaxRoll'),
          width: 130,
        }),
        this.colDef({
          colId: 'parents',
          headerValueGetter: () => 'Parents',
          field: this.fieldName('$parents'),
          width: 130,
          filter: SelectFilter,
        }),
      ],
    })
  )

  public entities: Observable<TableEntry[]> = defer(() => this.db.lootTables).pipe(map(selectTables)).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {
    super()
  }
}

function selectTables(tables: TableEntry[]) {
  const entries = tables.map((it): TableEntry => {
    return {
      ...it,
      $parents: null
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
