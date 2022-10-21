import { Injectable } from '@angular/core'
import { Ability } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwDbService } from '~/nw'
import { mithrilCell, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { shareReplayRefCount } from '~/utils'
import { TranslateService } from '~/i18n'
import { NwExpressionService } from '~/nw'

@Injectable()
export class AbilitiesTableAdapter extends DataTableAdapter<Ability> {
  public entityID(item: Ability): string {
    return item.AbilityID
  }

  public entityCategory(item: Ability): string {
    return item.WeaponTag
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: mithrilCell<Ability>({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('ability', data.AbilityID) }, [
                m(IconComponent, {
                  src: data.Icon,
                  class: `w-9 h-9 nw-icon`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('AbilityID'),
          hide: true,
        },
        {
          field: this.fieldName('Description'),
          width: 400,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          filterValueGetter: ({ data }) => {
            return this.i18n.get(data.Description)
          },
          cellRenderer: this.asyncCell(
            (data) => {
              return this.expr
                .solve({
                  text: this.i18n.get(data.Description),
                  charLevel: 60,
                  itemId: data.AbilityID,
                  gearScore: 600,
                })
                .pipe(map((it) => it.replace(/\\n/gi, '<br>')))
            },
            { trustHtml: true }
          ),
        },
        {
          field: this.fieldName('WeaponTag'),
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('AttackType'),
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('UICategory'),
          filter: SelectboxFilter,
        },
      ],
    })
  )

  public entities: Observable<Ability[]> = defer(() => {
    return this.db.abilities
  })
    .pipe(map((list) => list.filter((it) => !!it.WeaponTag && !!it.DisplayName && !!it.Description)))
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private expr: NwExpressionService) {
    super()
  }
}
