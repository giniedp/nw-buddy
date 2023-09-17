import { Injectable } from '@angular/core'
import { LootTable } from '@nw-data/common'
import { GridOptions } from '@ag-grid-community/core'
import { Observable, defer, map, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

export type TableEntry = LootTable & {
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

  public entityCategory(item: TableEntry): DataTableCategory {
    if (!item.$parents?.length) {
      return {
        icon: null,
        label: 'Roots',
        value: 'roots',
      }
    }
    return {
      icon: null,
      label: 'Children',
      value: 'children',
    }
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
          colId: 'source',
          headerValueGetter: () => 'Source',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            return data['$source']
          }),
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'conditions',
          headerValueGetter: () => 'Conditions',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => data.Conditions),
          getQuickFilterText: ({ value }) => value,
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
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
          valueGetter: this.valueGetter(({ data }) => data.$parents),
          width: 600,
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
        }),
      ],
    })
  )

  public entities: Observable<TableEntry[]> = defer(() => this.db.lootTables)
    .pipe(map(selectTables))
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {
    super()
  }
}

function selectTables(tables: TableEntry[]) {
  const entries = tables.map((it): TableEntry => {
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
