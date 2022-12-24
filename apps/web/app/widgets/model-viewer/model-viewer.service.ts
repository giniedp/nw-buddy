import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { defer, map, shareReplay } from 'rxjs'
import { CaseInsensitiveMap } from '~/utils'

export interface ItemModelInfo {
  itemId: string
  url: string
  isMale: boolean
  isFemale: boolean
  isMesh: boolean
}

export interface StatRow {
  itemId: string
  itemType: string
  model: string
  size: number
  tags: string[]
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
    return this.http.get<{ rows: StatRow[] }>('assets/models/stats.json').pipe(
      map((data): Map<string, ItemModelInfo[]> => {
        const result = new CaseInsensitiveMap<string, ItemModelInfo[]>()
        data.rows.forEach(({ itemId, tags, model, size }) => {
          if (!size || !model) {
            return
          }
          if (!result.has(itemId)) {
            result.set(itemId, [])
          }
          result.get(itemId).push({
            itemId,
            isMesh: tags.includes('mesh'),
            isMale: tags.includes('male'),
            isFemale: tags.includes('female'),
            url: `https://cdn.cany.link/item-models/${String(itemId).toLowerCase()}_${String(model).split(/[\\/]/).pop()}`,
          })
        })
        return result
      })
    )
  }
}
