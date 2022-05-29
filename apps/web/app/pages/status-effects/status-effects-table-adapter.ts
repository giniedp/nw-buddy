import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, shareReplay } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/core/nw'
import { mithrilCell, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { TranslateService } from '~/core/i18n'
import { humanize, shareReplayRefCount } from '~/core/utils'

@Injectable()
export class StatusEffectsAdapterService extends DataTableAdapter<Statuseffect> {
  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 74,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('status-effect', data.StatusID) }, [
                m(IconComponent, {
                  src: data.PlaceholderIcon || data['IconPath'],
                  class: `w-9 h-9 nw-icon`,
                }),
              ]),
          }),
        },
        {
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName) || data.StatusID),
          width: 300,
        },
        {
          headerName: 'Description',
          width: 300,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          cellRenderer: this.asyncCell((data) => {
            return this.nw.expression.solve({
              text: this.i18n.get(data.Description),
              charLevel: 60,
              itemId: data.Description,
              gearScore: 600
            })
          }, { trustHtml: true }),
          filterValueGetter: ({data}) => this.i18n.get(data.Description)
        },
        {
          field: this.fieldName('EffectCategories'),
          autoHeight: true,
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: true
          })
        },
      ],
    }
  }

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.nw.db.statusEffects
  })
  .pipe(map((list) => list.filter((it) => !!it.Description)))
  .pipe(
    shareReplayRefCount(1)
  )

  private perks: Map<string, Perks>

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
