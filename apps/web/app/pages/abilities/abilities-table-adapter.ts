import { Injectable } from '@angular/core'
import { Ability, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, filter, map, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { shareReplayRefCount } from '~/core/utils'

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
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('AbilityID'),
          hide: true,
        },
        {

          field: this.fieldName('Description'),
          width: 400,
          filter: false,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          cellRenderer: this.asyncCell((data) => {
            return this.nw.expression.solve({
              text: this.nw.translate(data.Description),
              charLevel: 60,
              itemId: data.AbilityID,
              gearScore: 600
            }).pipe(map((it) => it.replace(/\\n/gi, '<br>')))
          }, { trustHtml: true }),

        },
        {
          field: this.fieldName('WeaponTag'),
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('AttackType'),
          filter: SelectboxFilter,

        },
      ],
    })
  }

  public entities: Observable<Ability[]> = defer(() => {
    return this.nw.db.abilities
  })
    .pipe(map((list) => list.filter((it) => !!it.WeaponTag)))
    .pipe(shareReplayRefCount(1))

  public constructor(private nw: NwService) {
    super()
  }
}
