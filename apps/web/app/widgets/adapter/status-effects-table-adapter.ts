import { Inject, Injectable, Optional } from '@angular/core'
import { COLS_STATUSEFFECT } from '@nw-data/cols'
import { Statuseffect } from '@nw-data/types'
import { ColDef, GridOptions } from 'ag-grid-community'
import { sortBy } from 'lodash'
import { Observable, defer, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { NwExpressionService } from '~/nw/expression'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class StatusEffectsTableAdapterConfig extends DataTableAdapterOptions<Statuseffect> {
  //
}

@Injectable()
export class StatusEffectsTableAdapter extends DataTableAdapter<Statuseffect> {
  public static provider(config?: StatusEffectsTableAdapterConfig) {
    return dataTableProvider({
      adapter: StatusEffectsTableAdapter,
      options: config,
    })
  }

  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
  }

  public override get persistStateId(): string {
    return this.config?.persistStateId
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
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: this.info.link('status-effect', data.StatusID),
              target: '_blank',
              icon: data.PlaceholderIcon || data['IconPath'] || NW_FALLBACK_ICON,
              iconClass: [
                'nw-status-bg',
                data.IsNegative ? 'negative' : null,
                'p-1',
                'transition-all',
                'translate-x-0',
                'hover:translate-x-1',
              ],
            })
          }),
        }),
        this.colDef({
          colId: 'statusID',
          headerValueGetter: () => 'Status ID',
          hide: true,
          field: this.fieldName('StatusID'),
        }),
        this.colDef({
          colId: 'source',
          headerValueGetter: () => 'Source',
          hide: true,
          field: this.fieldName('$source' as any),
          filter: SelectFilter,
          filterParams: SelectFilter.params({
            showSearch: true,
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
              this.expression.solve({
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
          colId: 'baseDuration',
          headerValueGetter: () => 'Duration',
          field: this.fieldName('BaseDuration'),
        }),
        this.colDef({
          colId: 'effectCategories',
          headerValueGetter: () => 'Effect Categories',
          field: this.fieldName('EffectCategories'),
          autoHeight: true,
          filter: SelectFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
      ],
    }).pipe(
      map((options) => {
        return appendFields(options, Array.from(Object.entries(COLS_STATUSEFFECT)))
      })
    )
  )

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.config?.source || this.db.statusEffects
  })
    .pipe(map((list) => sortBy(list, (it) => it.StatusID)))
    .pipe(map((list) => sortBy(list, (it) => (it.Description ? -1 : 1))))
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private expression: NwExpressionService,
    private i18n: TranslateService,
    private info: NwLinkService,
    @Inject(DataTableAdapterOptions)
    @Optional()
    private config: StatusEffectsTableAdapterConfig
  ) {
    super()
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
