import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { ChangeDetectorRef, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getItemId } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, defer, of, switchMap, take, tap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { DataGridModule } from '~/ui/data/table-grid'
import { DataViewModule, provideDataView } from '~/ui/data/data-view'
import { JsonPriceTableAdapter } from './json-price-table-adapter'
import { JsonPriceItem } from './types'

@Component({
  standalone: true,
  selector: 'nwb-price-importer-json',
  templateUrl: './price-importer-json.component.html',
  imports: [CommonModule, FormsModule, DataViewModule, DataGridModule],
  providers: [
    provideDataView({
      adapter: JsonPriceTableAdapter,
    }),
  ],
  host: {
    class: 'layout-col',
  },
})
export class JsonPriceImporterComponent {
  protected url: string
  protected file: File

  protected error: Error
  protected isLoading = false
  protected isComplete = false

  protected rawData: Object
  protected data: JsonPriceItem[]
  protected keys: string[]
  protected keyId: string
  protected keyPrice: string
  protected scale: number = 1

  protected get fileName() {
    return this.file?.name
  }

  protected get showInput() {
    return !this.rawData && !this.isComplete && !this.error
  }

  protected get showLoading() {
    return this.isLoading
  }

  protected get showSuccess() {
    return !this.isLoading && this.isComplete && !this.error
  }

  protected get showError() {
    return !this.isLoading && this.isComplete && !!this.error
  }

  protected get canLoad() {
    return !!this.file || !!this.url
  }

  protected get showEditor() {
    return !this.isComplete && !!this.rawData && !this.data
  }

  protected get showPreview() {
    return !this.isComplete && !!this.rawData && !!this.data
  }

  private items: Map<string, ItemDefinitionMaster>
  private housing: Map<string, Housingitems>

  public constructor(
    private db: NwDbService,
    private pref: ItemPreferencesService,
    private dialog: Dialog,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef,
    private adapter: JsonPriceTableAdapter
  ) {}

  protected useFile(e: Event) {
    this.file = (e.target as HTMLInputElement)?.files?.[0]
    this.url = null
  }

  protected useUrl(e: Event) {
    this.file = null
    this.url = (e.target as HTMLInputElement)?.value
  }

  protected load() {
    defer(() => {
      if (this.file) {
        return this.readFile(this.file)
      }
      if (this.url) {
        return this.loadUrl(this.url)
      }
      return null
    })
      .pipe(
        switchMap((data) =>
          combineLatest({
            items: this.items ? of(this.items) : this.db.itemsMap,
            housing: this.housing ? of(this.housing) : this.db.housingItemsMap,
            data: of(data),
          })
        )
      )
      .pipe(take(1))
      .pipe(
        tap({
          subscribe: () => {
            this.isLoading = true
            this.rawData = null
            this.cdRef.markForCheck()
          },
          error: () => {
            this.isLoading = false
            this.rawData = null
            this.cdRef.markForCheck()
          },
          complete: () => {
            this.isLoading = false
            this.cdRef.markForCheck()
          },
        })
      )
      .subscribe(({ data, items, housing }) => {
        this.cdRef.markForCheck()
        this.isLoading = false
        this.items = items
        this.housing = housing
        this.rawData = data
        this.error = this.validateData(data)
        const inspect = this.extractKeys(data)
        this.keys = inspect.keys
        this.keyId = inspect.keyId
        this.keyPrice = inspect.keyPrice
      })
  }

  private readFile(file: File) {
    return new Promise<Object>((resolve, reject) => {
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
    return this.http.get(url, {
      responseType: 'json',
    })
  }

  private validateData(data: Object) {
    if (!data) {
      return new Error('no data')
    }
    if (!Array.isArray(data)) {
      return new Error('data must contains a JSON Array')
    }
    if (!data.length) {
      return new Error('data is empty')
    }
    return null
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
    const keyId = this.keyId
    const keyPrice = this.keyPrice
    const scale = this.scale
    const keys = this.keys.filter((it) => it !== keyId && it !== keyPrice)
    this.data = (this.rawData as Array<any>).map((it) => {
      const itemId = it[keyId]
      const item = this.items?.get(itemId) || this.housing?.get(itemId)
      return {
        id: itemId,
        item: item,
        price: Number(it[keyPrice]) * scale,
        data: it,
        keys: keys,
      }
    })
    this.adapter.entities.next(this.data)
  }

  protected import() {
    this.data.forEach((it) => {
      if (it.item) {
        this.pref.merge(getItemId(it.item), {
          price: it.price,
        })
      }
    })
    this.isComplete = true
  }

  protected close() {
    this.dialog?.closeAll()
  }
}
