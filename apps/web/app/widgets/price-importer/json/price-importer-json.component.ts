import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component, EventEmitter, inject, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, defer, map, Observable, take, tap } from 'rxjs'

import { injectNwData } from '~/data'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { IconsModule } from '~/ui/icons'
import { svgCircleNotch } from '~/ui/icons/svg'
import { JsonPriceTableAdapter } from './json-price-table-adapter'
import { JsonPriceItem } from './types'

export interface JsonImporterState {
  url?: string
  file?: File
  data?: Array<any>
  rows?: JsonPriceItem[]
  isLoading?: boolean
  isComplete?: boolean
  hasError?: boolean
}
@Component({
  standalone: true,
  selector: 'nwb-price-importer-json',
  templateUrl: './price-importer-json.component.html',
  imports: [CommonModule, FormsModule, DataViewModule, DataGridModule, IconsModule],
  providers: [
    provideDataView({
      adapter: JsonPriceTableAdapter,
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class JsonPriceImporterComponent extends ComponentStore<JsonImporterState> {
  private db = injectNwData()
  private http = inject(HttpClient)
  private adapter = inject(JsonPriceTableAdapter)

  @Output()
  protected dataReceived = new EventEmitter<JsonPriceItem[]>()

  protected file$ = this.selectSignal(({ file }) => file)
  protected url$ = this.selectSignal(({ url }) => url)
  protected rows$ = this.selectSignal(({ rows }) => rows)
  protected girdOptions = this.adapter.gridOptions()

  protected isLoading$ = this.selectSignal(({ isLoading }) => isLoading)
  protected hasError$ = this.selectSignal(({ hasError }) => hasError)

  protected showFileInput$ = this.selectSignal(({ data, rows }) => !data && !rows)
  protected showConverter$ = this.selectSignal(({ data, rows }) => !!data && !rows)
  protected showDataTable$ = this.selectSignal(({ rows }) => !!rows)

  protected keyId: string
  protected keyPrice: string
  protected keys: string[]
  protected scale: number = 1
  protected iconSpin = svgCircleNotch

  public constructor() {
    super({})
  }

  protected useFile(e: Event) {
    this.patchState({
      file: (e.target as HTMLInputElement)?.files?.[0],
      url: null,
    })
  }

  protected useUrl(e: Event) {
    this.patchState({
      file: null,
      url: (e.target as HTMLInputElement)?.value,
    })
  }

  protected loadFromFile(file: File) {
    const source$ = defer(() => this.readFile(file))
    this.load(source$)
  }

  protected loadFromUrl(url: string) {
    const source$ = this.loadUrl(url)
    this.load(source$)
  }

  protected load(source$: Observable<any>) {
    source$
      .pipe(
        tap({
          subscribe: () => {
            this.patchState({
              isLoading: true,
              data: null,
              rows: null,
              hasError: false,
            })
          },
        }),
        map((data) => {
          this.validateData(data)
          return {
            data,
            ...this.extractKeys(data),
          }
        }),
        tap({
          next: () => {
            this.patchState({
              isLoading: false,
              hasError: false,
            })
          },
          error: (e) => {
            console.error(e)
            this.patchState({
              isLoading: false,
              hasError: true,
            })
          },
        }),
      )
      .subscribe(({ data, keyId, keyPrice, keys }) => {
        this.keyId = keyId
        this.keyPrice = keyPrice
        this.keys = keys
        this.patchState({
          data,
        })
      })
  }

  private readFile(file: File) {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(reader.result as string))
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private loadUrl(url: string) {
    return this.http.get<any>(url, {
      responseType: 'json',
    })
  }

  private validateData(data: Object) {
    if (!data) {
      throw new Error('no data')
    }
    if (!Array.isArray(data)) {
      throw new Error('data must contain a JSON Array')
    }
    if (!data.length) {
      throw new Error('data is empty')
    }
  }

  protected extractKeys(data: Object) {
    if (!Array.isArray(data)) {
      return null
    }
    const keySet = new Set<string>()
    for (const item of data) {
      Object.keys(item).forEach((k) => keySet.add(k))
    }
    const keys = Array.from(keySet)
    const keyId = keys.find((it) => it.match(/itemid/i)) || keys.find((it) => it.match(/id/i))
    const keyPrice = keys.find((it) => it.match(/price/i)) || keys.find((it) => it.match(/value/i))
    return {
      keys,
      keyId,
      keyPrice,
    }
  }

  protected extract() {
    const data = this.get(({ data }) => data)
    const keyId = this.keyId
    const keyPrice = this.keyPrice
    const keys = this.keys.filter((it) => it !== keyId && it !== keyPrice)
    const scale = this.scale
    combineLatest({
      housing: this.db.housingItemsByIdMap(),
      items: this.db.itemsByIdMap(),
    })
      .pipe(
        map(({ housing, items }) => {
          return data.map((it) => {
            const itemId = it[keyId]
            const item = items.get(itemId) || housing?.get(itemId)
            return {
              id: itemId,
              item: item,
              price: Number(it[keyPrice]) * scale,
              data: it,
              keys: keys,
            }
          })
        }),
      )
      .pipe(take(1))
      .subscribe({
        next: (rows) => {
          this.patchState({ rows, isComplete: true })
          this.adapter.entities.next(rows)
          this.dataReceived.emit(rows)
        },
        error: (err) => {
          console.error(err)
          this.patchState({ hasError: true, isComplete: true })
        },
      })
  }
}
