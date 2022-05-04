import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { NwService } from '~/core/nw'
import { CategoryFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'


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
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('VitalsID'),
          hide: true,
        },
        {
          width: 80,
          field: this.fieldName('Level'),
        },
        {
          field: this.fieldName('Family'),
          filter: CategoryFilter,
        },
        {
          field: this.fieldName('CreatureType'),
          filter: CategoryFilter,
        },
        {
          field: this.fieldName('LootDropChance'),
          cellClass: 'text-right',
          valueGetter: this.valueGetter( ({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100) ),
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
