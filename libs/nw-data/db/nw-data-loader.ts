import { DataSheetUri } from '@nw-data/generated'
import { DataLoader } from './dsl'

export interface NwDataOptions {
  dataUrl: string
  imagesUrl: string
}

export class NwDataLoader implements DataLoader {
  private dataUrl: string
  private imagesUrl: string

  public constructor(options: NwDataOptions) {
    this.dataUrl = options.dataUrl
    this.imagesUrl = options.imagesUrl
  }

  public fetch(url: string) {
    return fetch(`${this.dataUrl}/${url}`)
  }

  public async fetchJson<T>(url: string): Promise<T> {
    return this.fetch(url).then((res) => res.json())
  }

  public async loadDatasheet<T>(url: DataSheetUri<T>, source?: string): Promise<Array<T & { $source: string }>> {
    return this.fetchJson<T[]>(url.uri)
      .then((res) => this.transformDatasheet(res))
      .then((data) => {
        if (source) {
          for (const item of data) {
            item['$source'] = source
          }
        }
        return data as Array<T & { $source: string }>
      })
  }

  public loadDatasheets<T>(
    collection: Record<string, DataSheetUri<T>>,
  ): Array<Promise<Array<T & { $source: string }>>> {
    return Object.keys(collection).map((key) => this.loadDatasheet(collection[key], key))
  }

  private transformDatasheet(data: any) {
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
          item[key] = this.imagesUrl + '/' + value
        }
        if (value.startsWith('@')) {
          item[key] = value.substring(1)
        }
      }
    }
    return data
  }
}
