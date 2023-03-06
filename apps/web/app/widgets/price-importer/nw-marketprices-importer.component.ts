import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectorRef, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { environment } from '../../../environments'
import { BehaviorSubject, catchError, combineLatest, defer, map, of, take, takeUntil, tap } from 'rxjs'
import { ElectronService } from '~/electron'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemRarity, isItemNamed, isMasterItem } from '~/nw/utils'
import { AppPreferencesService, ItemPreferencesService, StorageProperty } from '~/preferences'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { DestroyService, shareReplayRefCount } from '~/utils'
import { TrackingCell } from '../adapter/components'

export interface ServerOption {
  name: string
  id: number
}
export interface PriceItem {
  id: string
  price: number
  item: ItemDefinitionMaster | Housingitems
  availability: number
  updatedAt: Date
}

@Component({
  standalone: true,
  selector: 'nw-marketprices-importer',
  templateUrl: './nw-marketprices-importer.component.html',
  imports: [CommonModule, FormsModule, DataTableModule],
  providers: [DestroyService],
  host: {
    class: 'layout-col',
  },
})
export class NwPricesImporterComponent {
  protected servers = defer(() => this.fetchServers())
    .pipe(
      catchError(() => {
        this.isLoading = false
        this.data = null
        this.error = true
        this.isComplete = true
        this.cdRef.detectChanges()
        return of([])
      })
    )
    .pipe(shareReplayRefCount(1))

  protected serverId: string = ''
  protected isLoading: boolean
  protected isComplete: boolean
  protected data: PriceItem[]
  protected error: any
  protected adapter: PricesTableAdapter
  private nwmpServer: StorageProperty<string>

  public get showInput() {
    return !this.data && !this.isComplete && !this.error
  }

  public get showLoading() {
    return this.isLoading
  }

  public get showPreview() {
    return !this.isLoading && this.data
  }

  public get showSuccess() {
    return !this.isLoading && this.isComplete && !this.error
  }

  public get showError() {
    return !this.isLoading && this.isComplete && !!this.error
  }

  protected get isStandalone() {
    return environment.standalone
  }

  public constructor(
    private http: HttpClient,
    private db: NwDbService,
    private pref: ItemPreferencesService,
    private cdRef: ChangeDetectorRef,
    private destroy: DestroyService,
    private dialog: Dialog,
    private electron: ElectronService,
    info: NwLinkService,
    nw: NwService,
    i18n: TranslateService,
    app: AppPreferencesService
  ) {
    this.adapter = new PricesTableAdapter(nw, i18n, info)
    this.nwmpServer = app.nwmpServer
    this.serverId = this.nwmpServer.get()
  }

  public load(server: string) {
    this.nwmpServer.set(server)
    combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      prices: this.fetchPrices(server),
    })
      .pipe(take(1))
      .pipe(
        tap({
          subscribe: () => {
            this.isLoading = true
            this.data = null
            this.cdRef.markForCheck()
          },
          complete: () => {
            this.isLoading = false
            this.cdRef.markForCheck()
          },
          error: () => {
            this.isLoading = false
            this.data = null
            this.error = true
            this.isComplete = true
            this.cdRef.markForCheck()
          },
        })
      )
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ items, housing, prices }) => {
        this.data = prices.map((it): PriceItem => {
          const item = items.get(it.id) || housing.get(it.id)
          return {
            id: it.id,
            item: item,
            price: it.price,
            availability: it.availability,
            updatedAt: it.updatedAt,
          }
        })
        this.adapter.entities.next(this.data)
      })
  }

  public import() {
    this.data.forEach((it) => {
      if (it.item) {
        this.pref.merge(getItemId(it.item), {
          price: it.price,
        })
      }
    })
    this.data = null
    this.isComplete = true
  }

  public close() {
    this.dialog.closeAll()
  }

  private fetchServers() {
    const url = this.isStandalone ? 'https://nwmarketprices.com/api/servers/' : '/api/nwm/servers'
    return this.http.get<Record<string, { name: string }>>(url).pipe(
      map((it) => {
        return Object.keys(it).map((k) => ({ id: k, name: it[k].name }))
      })
    )
  }

  private fetchPrices(server: string) {
    const url = this.isStandalone
      ? `https://nwmarketprices.com/api/latest-prices/${server}/`
      : `/api/nwm/servers/${server}`
    return this.http
      .get<Array<{ ItemId: string; Price: string; Availability: number; LastUpdated: string }>>(url, {
        params: {
          serverName: server,
        },
      })
      .pipe(
        map((list) => {
          return list.map((it) => ({
            id: it.ItemId,
            price: Number(it.Price),
            availability: it.Availability,
            updatedAt: it.LastUpdated ? new Date(it.LastUpdated) : null,
          }))
        })
      )
  }
}

export class PricesTableAdapter extends DataTableAdapter<PriceItem> {
  public entityID(item: PriceItem): string {
    return item.id
  }

  public entityCategory(item: PriceItem): string {
    return null
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 62,
          pinned: true,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: this.info.link('item', data.id),
              target: '_blank',
              icon: getItemIconPath(data.item),
              rarity: getItemRarity(data.item),
              named: isMasterItem(data.item) && isItemNamed(data.item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        },
        {
          width: 250,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.item?.Name)),
          cellRenderer: this.cellRenderer(({ value }) => this.makeLineBreaks(value)),
          cellClass: ['multiline-cell'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        },
        {
          headerName: 'Old Price',
          headerTooltip: 'Current price in Trading post',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(getItemId(data.item))?.price),
          cellRenderer: TrackingCell,
          cellRendererParams: TrackingCell.params({
            getId: (value: PriceItem) => getItemId(value.item),
            pref: this.nw.itemPref,
            mode: 'price',
            formatter: this.moneyFormatter,
          }),
          width: 100,
        },
        {
          headerName: 'New Price',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => data.price),
          valueFormatter: ({ value }) => this.moneyFormatter.format(value),
          width: 100,
        },
        {
          headerName: 'Availability',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => data.availability),
          width: 100,
        },
        {
          headerName: 'Updated at',
          cellClass: 'text-right',
          valueGetter: this.valueGetter(({ data }) => data.updatedAt?.toLocaleDateString()),
          width: 100,
        },
      ],
    })
  )

  public entities = new BehaviorSubject<PriceItem[]>(null)

  public constructor(private nw: NwService, private i18n: TranslateService, private info: NwLinkService) {
    super()
  }
}
