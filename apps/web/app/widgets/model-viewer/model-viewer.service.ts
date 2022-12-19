import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { defer, map, shareReplay } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

export interface ItemModelInfo {
  url: string
  isMale: boolean
  isFemale: boolean
  isMesh: boolean
}

@Injectable({ providedIn: 'root' })
export class ModelViewerService {
  private data$ = defer(() => this.fetch()).pipe(shareReplay(1))

  public constructor(private http: HttpClient) {
    //
  }

  public getModelInfos(itemId: string) {
    return this.data$.pipe(map((data) => data.get(itemId)))
  }

  private fetch() {
    return this.http.get<any>('assets/models/stats.json').pipe(
      map((data): Map<string, ItemModelInfo[]> => {
        const result = new CaseInsensitiveMap<string, ItemModelInfo[]>()
        data.rows.map(({ itemId, tags, model }) => {
          if (!result.has(itemId)) {
            result.set(itemId, [])
          }
          result.get(itemId).push({
            isMesh: tags.includes('mesh'),
            isMale: tags.includes('male'),
            isFemale: tags.includes('female'),
            url: `https://new-world.guide/cdn/item-models/${String(itemId).toLowerCase()}_${String(model)
              .split(/[\\/]/)
              .pop()}`,
          })
        })
        return result
      })
    )
  }
}
