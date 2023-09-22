import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { catchError, combineLatest, defer, map, of, take, takeUntil, tap } from 'rxjs'
import { NwDbService } from '~/nw'
import { AppPreferencesService, ItemPreferencesService, StorageProperty } from '~/preferences'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { shareReplayRefCount } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { NwmpPriceTableAdapter } from './nwmp-price-table-adapter'
import { NwmpPriceItem, NwmpServerOption } from './types'

export interface NwmpImporterState {
  serverId: string
  servers: NwmpServerOption[]
  data: any
  error: any
  isLoading: boolean
  isComplete: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-price-importer-nwmp',
  templateUrl: './price-importer-nwmp.component.html',
  imports: [CommonModule, FormsModule, DataViewModule, DataGridModule],
  providers: [
    provideDataView({
      adapter: NwmpPriceTableAdapter,
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class NwmpPriceImporterComponent extends ComponentStore<NwmpImporterState> implements OnInit {
  protected data$ = this.selectSignal(({ data }) => data)
  protected servers$ = this.selectSignal(({ servers }) => servers)
  protected serverId$ = this.selectSignal(({ serverId }) => serverId)
  protected showLoading$ = this.selectSignal(({ isLoading }) => isLoading)
  protected showServers$ = this.selectSignal(({ isLoading, data, servers }) => !isLoading && !data && servers)
  protected showPreview$ = this.selectSignal(({ isLoading, data }) => !isLoading && data)
  protected showSuccess$ = this.selectSignal(({ isLoading, isComplete, error }) => !isLoading && isComplete && !error)
  protected showError$ = this.selectSignal(({ isLoading, isComplete, error }) => !isLoading && isComplete && !!error)
  protected showInput$ = this.selectSignal(({ isLoading, isComplete, error }) => !isLoading && !isComplete && !error)

  private nwmpServer: StorageProperty<string>

  protected get isStandalone() {
    return this.platform.env.standalone || this.platform.env.environment === 'DEV'
  }

  public constructor(
    private http: HttpClient,
    private db: NwDbService,
    private pref: ItemPreferencesService,
    private dialog: Dialog,
    private platform: PlatformService,
    private adapter: NwmpPriceTableAdapter,
    app: AppPreferencesService
  ) {
    super({
      servers: [],
      serverId: app.nwmpServer.get(),
      data: null,
      error: null,
      isLoading: false,
      isComplete: false,
    })
    this.nwmpServer = app.nwmpServer
  }

  public ngOnInit(): void {
    this.fetchServers()
      .pipe(
        take(1),
        tap({
          subscribe: () => {
            this.patchState({ isLoading: true, data: null })
          },
          complete: () => {
            this.patchState({ isLoading: false })
          },
          error: () => {
            this.patchState({ isLoading: false, data: null, error: true, isComplete: true })
          },
        }),
        takeUntil(this.destroy$)
      )
      .pipe()
      .subscribe((data) => {
        this.patchState({ servers: data })
      })
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
            this.patchState({ isLoading: true, data: null })
          },
          complete: () => {
            this.patchState({ isLoading: false })
          },
          error: () => {
            this.patchState({ isLoading: false, data: null, error: true, isComplete: true })
          },
        }),
        map(({ items, housing, prices }) => {
          return prices.map((it): NwmpPriceItem => {
            const item = items.get(it.id) || housing.get(it.id)
            return {
              id: it.id,
              item: item,
              price: it.price,
              availability: it.availability,
              updatedAt: it.updatedAt,
            }
          })
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.patchState({ data })
        this.adapter.entities.next(data)
      })
  }

  public import() {
    this.data$().forEach((it) => {
      if (it.item) {
        this.pref.merge(getItemId(it.item), {
          price: it.price,
        })
      }
    })
    this.patchState({
      isComplete: true,
      data: null,
    })
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
