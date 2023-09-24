import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map } from 'rxjs'
import { PlatformService } from '~/utils/services/platform.service'

@Injectable({
  providedIn: 'root',
})
export class NwmpApiService {
  protected get isStandalone() {
    return this.platform.env.standalone || this.platform.env.environment === 'DEV'
  }

  public constructor(private http: HttpClient, private platform: PlatformService) {
    //
  }

  public fetchServers() {
    let url = 'https://nwmarketprices.com/api/servers/'
    if (!this.isStandalone) {
      url = '/api/nwm/servers'
    }
    return this.http.get<Record<string, { name: string }>>(url).pipe(
      map((it) => {
        return Object.keys(it).map((k) => ({ id: k, name: it[k].name }))
      })
    )
  }

  public fetchPrices(server: string) {
    let url = `https://nwmarketprices.com/api/latest-prices/${server}/`
    if (!this.isStandalone) {
      url = `/api/nwm/servers/${server}`
    }

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
