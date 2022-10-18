import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectorRef, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { combineLatest, defer, map, take, takeUntil, tap } from 'rxjs'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemPreferencesService } from '~/preferences'
import { DestroyService, shareReplayRefCount } from '~/utils'

export interface ServerOption {
  name: string
  id: number
}
@Component({
  standalone: true,
  selector: 'nw-marketprices-importer',
  templateUrl: './nw-marketprices-importer.component.html',
  imports: [CommonModule, FormsModule],
  providers: [DestroyService],
  host: {
    class: 'form-control',
  },
})
export class NwPricesImporterComponent {
  protected servers = defer(() => this.fetchServers()).pipe(shareReplayRefCount(1))

  protected serverId: string = ''
  protected isLoading: boolean

  public constructor(
    private http: HttpClient,
    private db: NwDbService,
    private pref: ItemPreferencesService,
    private cdRef: ChangeDetectorRef,
    private destroy: DestroyService
  ) {
    //
  }

  public import(server: string) {
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
            this.cdRef.markForCheck()
          },
          complete: () => {
            this.isLoading = false
            this.cdRef.markForCheck()
          },
          error: () => {
            this.isLoading = false
            this.cdRef.markForCheck()
          },
        })
      )
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ items, housing, prices }) => {
        prices.forEach((it) => {
          const item = items.get(it.id) || housing.get(it.id)
          if (item) {
            this.pref.merge(getItemId(item), {
              price: it.price,
            })
          }
        })
      })
  }

  private fetchServers() {
    return this.http.get<Record<string, { name: string }>>('https://nwmarketprices.com/api/servers/').pipe(
      map((it) => {
        return Object.keys(it).map((k) => ({ id: k, name: it[k].name }))
      })
    )
  }

  private fetchPrices(server: string) {
    return this.http
      .get<Array<{ ItemId: string; Price: string; Availability: number }>>(
        `https://nwmarketprices.com/api/latest-prices/${server}/`,
        {
          params: {
            serverName: server,
          },
        }
      )
      .pipe(
        map((list) => {
          return list.map((it) => ({
            id: it.ItemId,
            price: Number(it.Price)
          }))
        })
      )
  }
}
