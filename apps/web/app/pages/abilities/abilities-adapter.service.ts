import { Injectable } from '@angular/core'
import { Ability, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'

function fieldName(key: keyof Ability) {
  return key
}

function field(item: any, key: keyof Ability) {
  return item[key]
}

@Injectable()
export class AbilitiesAdapterService extends DataTableAdapter<Ability> {
  public entityID(item: Ability): string {
    return item.AbilityID
  }

  public entityCategory(item: Ability): string {
    return item.WeaponTag
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: mithrilCell<Ability>({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: this.nw.nwdbUrl('ability', data.AbilityID) }, [
                m(IconComponent, {
                  src: this.nw.iconPath(data.Icon),
                  class: `w-9 h-9 nw-icon`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: ({ data }) => this.nw.translate(field(data, 'DisplayName')),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: fieldName('AbilityID'),
          hide: true,
        },
        // {
        //   field: fieldName('Description'),
        //   cellRenderer: this.nw.cellRendererAsync<Ability>((data) => {
        //     return this.nw.expression.solve({
        //       text: this.nw.translate(data.Description),
        //       charLevel: 60,
        //       itemId: data.AbilityID
        //     })
        //   }),
        //   width: 300,
        //   filter: false,
        // },
        {
          field: fieldName('WeaponTag'),
        },
        {
          field: fieldName('AttackType'),
        },
      ],
    })
  }

  public entities: Observable<Ability[]> = defer(() => {
    return this.nw.db.abilities
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
