import { Injectable } from '@angular/core'
import { Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'

@Injectable()
export class PerksAdapterService extends DataTableAdapter<Perks> {
  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): string {
    return item.PerkType
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',

      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 74,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) => {
              return m('a', { target: '_blank', href: this.nw.nwdbUrl('perk', data.PerkID) }, [
                m(IconComponent, {
                  src: this.nw.iconPath(data.IconPath),
                  class: `w-9 h-9 nw-icon`,
                }),
              ])
            },
          }),
        },
        {
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => {
            const name = data.DisplayName
            if (name) {
              return this.nw.translate(name)
            }
            const suffix = data.AppliedSuffix
            if (suffix) {
              return `${data.ExclusiveLabels}: ${this.nw.translate(suffix)}`
            }
            return ''
          }),
          width: 300,
        },
        {
          headerName: 'Type',
          field: this.fieldName('PerkType'),
          width: 100,
        },
        {
          headerName: 'Prefix',
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.AppliedPrefix)),
          width: 150,
        },
        {
          headerName: 'Suffix',
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.AppliedSuffix)),
          width: 150,
        },
        {
          field: this.fieldName('PerkID'),
          hide: true,
        },
        {
          field: this.fieldName('Tier'),
          width: 100,
        },
        {
          field: this.fieldName('ItemClass'),
        },

        {
          field: this.fieldName('ExclusiveLabels'),
        },
        {
          field: this.fieldName('ExcludeItemClass'),
        },
      ],
    })
  }

  public entities: Observable<Perks[]> = defer(() => {
    return this.nw.db.perks
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
