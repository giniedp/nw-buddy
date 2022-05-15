import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, switchMap } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { SelectboxFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { shareReplayRefCount } from '~/core/utils'

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
            return {
              name: data.DisplayName && this.nw.translate(data.DisplayName),
              suffix: data.AppliedSuffix && this.nw.translate(data.AppliedSuffix),
              prefix: data.AppliedPrefix && this.nw.translate(data.AppliedPrefix),
            }
          }),
          getQuickFilterText: ({ value }) => {
            return [value.name, value.suffix, value.prefix].join(' ')
          },
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { value }}) => {
              return m('div.flex.flex-col', [
                value.name && m('span', value.name),
                value.prefix && m('span.italic', `${value.prefix} …`),
                value.suffix && m('span.italic', `… ${value.suffix}`),
              ])
            }
          }),
          width: 300,
        },
        {
          width: 500,
          headerName: 'Description',
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          cellRenderer: this.asyncCell((data) => {
            return this.nw.translate$(data.Description).pipe(switchMap((value) => {
              return this.nw.expression.solve({
                text: value,
                charLevel: 60,
                gearScore: 600,
                itemId: data.PerkID,
              })
            }))
          })
        },
        {
          headerName: 'Type',
          field: this.fieldName('PerkType'),
          width: 100,
        },
        {
          width: 500,
          field: this.fieldName('ItemClass'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(),
        },
        {
          field: this.fieldName('ExclusiveLabels'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(),
        },
        {
          field: this.fieldName('ExcludeItemClass'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(),
        },
      ],
    })
  }

  public entities: Observable<Perks[]> = defer(() => {
    return this.nw.db.perks
  }).pipe(
    shareReplayRefCount(1)
  )

  public constructor(private nw: NwService) {
    super()
  }
}
