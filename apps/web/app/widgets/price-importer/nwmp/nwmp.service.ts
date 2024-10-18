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

  public constructor(
    private http: HttpClient,
    private platform: PlatformService,
  ) {
    //
  }

  public fetchServers() {
    let url = 'https://gaming.tools/prices/nwmp/servers'
    // if (!this.isStandalone) {
    //   url = '/api/nwm/servers'
    // }
    return this.http.get<Array<{ name: string }>>(url).pipe(
      map((list) => {
        return list.map(({ name }, i) => ({ id: name, name: name }))
      }),
    )
  }

  public fetchPrices(server: string) {
    let url = `https://gaming.tools/prices/nwmp`
    let params: Record<string, string> = { serverName: server }
    // if (!this.isStandalone) {
    //   url = `/api/nwm/prices`
    //   params = { server }
    // }

    return this.http
      .get<Array<{ id: string; price: string }>>(url, {
        params,
      })
      .pipe(
        map((list) => {
          return list.map((it) => ({
            id: it.id,
            price: Number(it.price),
          }))
        }),
      )
  }
}
