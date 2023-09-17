import { Injectable } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { PoiDefinition } from '@nw-data/generated'
import { GridOptions } from '@ag-grid-community/core'
import { defer, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class PoiTableAdapter extends DataTableAdapter<PoiDefinition> {
  public static provider() {
    return dataTableProvider({
      adapter: PoiTableAdapter,
    })
  }

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
              target: '_blank',
              href: this.info.link('poi', String(data.TerritoryID)),
              icon: data.MapIcon || data.CompassIcon || data.TooltipBackground || NW_FALLBACK_ICON,
              iconClass: ['scale-125', 'transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.NameLocalizationKey)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'description',
          headerValueGetter: () => 'Description',
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(`${data.NameLocalizationKey}_description`)),
          cellRenderer: this.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'groupSize',
          headerValueGetter: () => 'groupSize',
          field: this.fieldName('GroupSize'),
          hide: true,
        }),
        this.colDef({
          colId: 'lootTags',
          headerValueGetter: () => 'Loot Tags',
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectFilter,
          valueGetter: this.valueGetter(({ data }) => data.LootTags),
          filterParams: SelectFilter.params({
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'levelRange',
          headerValueGetter: () => 'Level Range',
          field: this.fieldName('LevelRange'),
          hide: false,
        }),
        this.colDef({
          colId: 'vitalsCategory',
          headerValueGetter: () => 'Vitals Category',
          field: this.fieldName('VitalsCategory'),
          hide: false,
        }),
      ],
    })
  )

  public entities: Observable<PoiDefinition[]> = defer(() => {
    return this.db.pois
  }).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private info: NwLinkService) {
    super()
  }
}
