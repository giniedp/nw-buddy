import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, exhaustAll, map, Observable, of, shareReplay } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/nw'
import { AsyncCellRenderer, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { TranslateService } from '~/i18n'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectsTableAdapter extends DataTableAdapter<Statuseffect> {
  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      suppressAnimationFrame: true,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('status-effect', data.StatusID),
              target: '_blank',
              icon: data.PlaceholderIcon || data['IconPath'],
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName) || data.StatusID),
          width: 300,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          width: 300,
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          valueGetter: ({ data }) => this.i18n.get(data.Description),
          cellRenderer: this.cellRendererAsync(),
          cellRendererParams: this.cellRendererAsyncParams<string>({
            source: ({ data, value }) =>
              this.nw.expression.solve({
                text: value,
                charLevel: 60,
                itemId: data.Description,
                gearScore: 600,
              }),
            update: (el, text) => {
              el.innerHTML = this.makeLineBreaks(text)
            },
          }),
        }),
        this.colDef({
          colId: 'effectCategories',
          headerValueGetter: () => 'Effect Categories',
          field: this.fieldName('EffectCategories'),
          autoHeight: true,
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: true,
          }),
        }),
      ],
    })
  )

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.nw.db.statusEffects
  })
    .pipe(map((list) => list.filter((it) => !!it.Description)))
    .pipe(shareReplayRefCount(1))

  private perks: Map<string, Perks>

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}