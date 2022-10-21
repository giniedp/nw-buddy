import { Injectable } from '@angular/core'
import { PoiDefinition } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import m from 'mithril'
import { defer, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { IconComponent, nwdbLinkUrl, NwService } from '~/nw'
import { AgGridComponent, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class PoiTableAdapter extends DataTableAdapter<PoiDefinition> {
  public entityID(item: PoiDefinition): string | number {
    return item.TerritoryID
  }

  public entityCategory(item: PoiDefinition): string {
    return null
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
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('zone', String(data.TerritoryID)) }, [
                m(IconComponent, {
                  src: data.MapIcon || data.CompassIcon || data.TooltipBackground,
                  class: `w-9 h-9 nw-icon scale-125`,
                }),
              ]),
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.NameLocalizationKey)),
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { value } }) => m.trust(value.replace(/\\n/g, '<br>'))
          }),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        },
        {
          width: 250,
          headerName: 'Description',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(`${data.NameLocalizationKey}_description`)),
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { value } }) => m.trust(value.replace(/\\n/g, '<br>'))
          }),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('GroupSize'),
          hide: true,
        },
        {
          field: this.fieldName('LootTags'),
          // valueFormatter: ({ value }) => humanize(value),
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true,
            showCondition: true,
          })
        },
        {
          field: this.fieldName('LevelRange'),
          hide: false,
        },
        {
          field: this.fieldName('VitalsCategory'),
          hide: false,
        },
      ],
    }
  ))

  public entities: Observable<PoiDefinition[]> = defer(() => {
    return this.nw.db.pois
  }).pipe(
    shareReplayRefCount(1)
  )

  public override setActiveCategories(grid: AgGridComponent, value: string[]): void {
    //
  }

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
