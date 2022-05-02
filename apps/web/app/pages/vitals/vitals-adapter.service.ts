import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { NwService } from '~/core/nw'
import { CategoryFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'

function fieldName(key: keyof Vitals) {
  return key
}

function getter(fn: (params: Vitals) => any) {
  return fn
}

function field(item: any, key: keyof Vitals) {
  return item[key]
}

@Injectable()
export class VitalsAdapterService extends DataTableAdapter<Vitals> {
  public entityID(item: Vitals): string {
    return item.VitalsID
  }

  public entityCategory(item: Vitals): string {
    return item.Family
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          width: 250,
          headerName: 'Name',
          valueGetter: ({ data }) => this.nw.translate(field(data, 'DisplayName')),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: fieldName('VitalsID'),
          hide: true,
        },
        {
          width: 80,
          field: fieldName('Level'),
        },
        {
          field: fieldName('Family'),
          filter: CategoryFilter,
        },
        {
          field: fieldName('CreatureType'),
          filter: CategoryFilter,
        },
        {
          field: fieldName('LootDropChance'),
          cellClass: 'text-right',
          valueGetter: ({ data }) => Math.round((field(data, 'LootDropChance') || 0) * 100),
          valueFormatter: ({ value }) => `${value}%`
        },
      ],
    })
  }

  public entities: Observable<Vitals[]> = defer(() => {
    return this.nw.db.vitals
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService) {
    super()
  }
}
