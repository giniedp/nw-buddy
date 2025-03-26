import { DataSheetUri } from '@nw-data/generated'
import { DataLoader } from './dsl'

export interface NwDataOptions {
  dataUrl: string
  imagesUrl: string
  baseUrl?: string
}

export class NwDataLoader implements DataLoader {
  private baseUrl: string
  private dataUrl: string
  private imagesUrl: string

  public constructor(options: NwDataOptions) {
    this.dataUrl = options.dataUrl
    this.imagesUrl = options.imagesUrl
    this.baseUrl = options.baseUrl
  }

  public fetch(url: string) {
    url = `${this.dataUrl}/${url}`
    if (this.baseUrl) {
      url = new URL(url, this.baseUrl).toString()
    }
    return fetch(url)
  }

  public async fetchJson<T>(url: string): Promise<T> {
    return this.fetch(url).then((res) => res.json())
  }

  public async loadDatasheet<T>(url: DataSheetUri<T>, source?: string): Promise<Array<T & { $source: string }>> {
    const uris = Array.isArray(url.uri) ? url.uri : [url.uri]
    return Promise.all(
      uris.map(async (uri) => {
        return this.fetchJson<T[]>(uri)
          .then((res) => this.transformDatasheet(res))
          .then((data) => {
            if (source) {
              for (const item of data) {
                item['$source'] = source
                item['$uri'] = uri
              }
            }
            return data as Array<T & { $source: string }>
          })
      }),
    )
      .then((list) => list.flat(1))
      .catch((err) => {
        console.error('Failed to load datasheet', url, err)
        return []
      })
  }

  public loadDatasheets<T>(
    collection: Record<string, DataSheetUri<T>>,
  ): Array<Promise<Array<T & { $source: string }>>> {
    return Object.keys(collection).map((key) => this.loadDatasheet(collection[key], key))
  }

  private transformDatasheet(data: any) {
    if (!data) {
      data = []
    }
    if (!Array.isArray(data)) {
      return data
    }
    for (const item of data) {
      for (const key in item) {
        const value = item[key]
        if (typeof value !== 'string') {
          continue
        }
        if (value.startsWith('lyshineui')) {
          item[key] = (this.imagesUrl + '/' + value).toLowerCase()
        }
        if (value.startsWith('@')) {
          item[key] = value.substring(1)
        }
      }
    }
    return data
  }
}
