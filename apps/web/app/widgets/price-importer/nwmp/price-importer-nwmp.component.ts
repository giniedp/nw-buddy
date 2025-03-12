import { CommonModule } from '@angular/common'
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { getItemId } from '@nw-data/common'
import { combineLatest, map, take, tap } from 'rxjs'
import { injectNwData } from '~/data'
import { AppPreferencesService, ItemPreferencesService, StorageProperty } from '~/preferences'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { IconsModule } from '~/ui/icons'
import { svgCircleNotch } from '~/ui/icons/svg'
import { NwmpPriceTableAdapter } from './nwmp-price-table-adapter'
import { NwmpApiService } from './nwmp.service'
import { NwmpPriceItem, NwmpServerOption } from './types'

export interface NwmpImporterState {
  serverId: string
  servers: NwmpServerOption[]
  data: NwmpPriceItem[]
  error: any
  isLoading: boolean
  isComplete: boolean
}

@Component({
  selector: 'nwb-price-importer-nwmp',
  templateUrl: './price-importer-nwmp.component.html',
  imports: [CommonModule, IconsModule, FormsModule, DataViewModule, DataGridModule],
  providers: [
    provideDataView({
      adapter: NwmpPriceTableAdapter,
    }),
  ],
  host: {
    class: 'flex-1 flex flex-col',
  },
})
export class NwmpPriceImporterComponent extends ComponentStore<NwmpImporterState> implements OnInit {
  private db = injectNwData()
  private api = inject(NwmpApiService)
  private pref = inject(ItemPreferencesService)
  protected adapter = inject(NwmpPriceTableAdapter)

  @Output()
  protected dataReceived = new EventEmitter<NwmpPriceItem[]>()

  protected data$ = this.selectSignal(({ data }) => data)
  protected girdOptions = this.adapter.gridOptions()
  protected servers$ = this.selectSignal(({ servers }) => servers)
  protected serverId$ = this.selectSignal(({ serverId }) => serverId)
  protected isLoading$ = this.selectSignal(({ isLoading }) => isLoading)
  protected hasError$ = this.selectSignal(({ error }) => error)

  protected showBootloader$ = this.selectSignal(({ isLoading, servers, data }) => isLoading && !servers && !data)
  protected showServerInput$ = this.selectSignal(({ servers, data }) => !!servers && !data)
  protected showDataTable$ = this.selectSignal(({ servers, data }) => !!servers && !!data)

  protected iconSpin = svgCircleNotch
  private nwmpServer: StorageProperty<string>

  public constructor(app: AppPreferencesService) {
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
    this.api
      .fetchServers()
      .pipe(
        tap({
          subscribe: () => {
            this.patchState({ isLoading: true, data: null, servers: null, error: null, isComplete: false })
          },
        }),
        take(1),
      )
      .subscribe({
        next: (data) => {
          this.patchState({ isLoading: false, data: null, servers: data, error: null, isComplete: false })
        },
        error: () => {
          this.patchState({ isLoading: false, data: null, servers: null, error: true, isComplete: true })
        },
      })
  }

  public load(server: string) {
    this.nwmpServer.set(server)
    combineLatest({
      items: this.db.itemsByIdMap(),
      housing: this.db.housingItemsByIdMap(),
      prices: this.api.fetchPrices(server),
    })
      .pipe(
        tap({
          subscribe: () => {
            this.patchState({ isLoading: true, data: null })
          },
        }),
        map(({ items, housing, prices }) => {
          return prices.map((it): NwmpPriceItem => {
            const item = items.get(it.id) || housing.get(it.id)
            return {
              id: it.id,
              item: item,
              price: it.price,
            }
          })
        }),
      )

      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.patchState({ isLoading: false, data: data, error: null, isComplete: false })
          this.adapter.entities.next(data)
          this.dataReceived.emit(data)
        },
        error: () => {
          this.patchState({ isLoading: false, data: null, error: true, isComplete: true })
        },
      })
  }

  public import() {
    this.data$().forEach((it) => {
      if (it.item) {
        this.pref.merge(getItemId(it.item).toLowerCase(), {
          price: it.price,
        })
      }
    })
    this.patchState({
      isComplete: true,
      data: null,
    })
  }
}
