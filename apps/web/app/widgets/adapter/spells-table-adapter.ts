import { Injectable, Optional } from '@angular/core'
import { COLS_SPELLTABLE } from '@nw-data/generated'
import { Spelltable } from '@nw-data/generated'
import { ColDef, GridOptions } from '@ag-grid-community/core'
import { defer, map, Observable, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize } from '~/utils'

@Injectable()
export class SpellsTableAdapter extends DataTableAdapter<Spelltable> {
  public static provider(config?: DataTableAdapterOptions<Spelltable>) {
    return dataTableProvider({
      adapter: SpellsTableAdapter,
      options: config,
    })
  }

  public entityID(item: Spelltable): string {
    return item.SpellID
  }

  public entityCategory(item: Spelltable): DataTableCategory {
    return {
      icon: null,
      label: item['$source'],
      value: item['$source'],
    }
  }
  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'spellID',
          headerValueGetter: () => 'ID',
          field: this.fieldName('SpellID'),
        }),
      ],
    })
  ).pipe(
    map((options) => {
      appendFields(options.columnDefs, Array.from(Object.entries(COLS_SPELLTABLE)))
      return options
    })
  )

  public entities: Observable<Spelltable[]> = defer(() => this.db.spells)

  public constructor(
    private db: NwDbService,
    @Optional()
    private config: DataTableAdapterOptions<Spelltable>
  ) {
    super()
  }
}

function appendFields(columns: Array<ColDef>, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = columns.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => data[field],
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    columns.push(colDef)
  }
}
