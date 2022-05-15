import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'

@Injectable()
export class StatusEffectsAdapterService extends DataTableAdapter<Statuseffect> {
  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
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
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: this.nw.nwdbUrl('status-effect', data.StatusID) }, [
                m(IconComponent, {
                  src: this.nw.iconPath(data.PlaceholderIcon || data['IconPath']),
                  class: `w-9 h-9 nw-icon`,
                }),
              ]),
          }),
        },
        {
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.DisplayName) || data.StatusID),
          width: 300,
        },
        {
          headerName: 'Description',
          width: 300,
          filter: false,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          cellRenderer: this.asyncCell((data) => {
            return this.nw.expression.solve({
              text: this.nw.translate(data.Description),
              charLevel: 60,
              itemId: data.Description,
              gearScore: 600
            })
          }, { trustHtml: true }),
        },
        {
          field: this.fieldName('EffectCategories'),
          autoHeight: true,
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(),
        },
      ],
    })
  }

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.nw.db.statusEffects
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  private perks: Map<string, Perks>

  public constructor(private nw: NwService) {
    super()
  }
}
