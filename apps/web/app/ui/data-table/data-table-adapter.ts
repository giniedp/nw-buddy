import { ClassProvider, ExistingProvider, Injectable, StaticProvider, Type } from '@angular/core'
import {
  ColDef,
  GridOptions,
  ICellRendererFunc,
  RowDataTransaction,
  ValueFormatterFunc,
  ValueFormatterParams,
  ValueGetterFunc,
  ValueGetterParams,
} from 'ag-grid-community'
import { AgGridCommon } from 'ag-grid-community/dist/lib/interfaces/iCommon'
import { BehaviorSubject, defer, firstValueFrom, map, Observable, ReplaySubject, Subject } from 'rxjs'
import { createEl, CreateElAttrs, createElement, CreateElementOptions, shareReplayRefCount, TagName } from '~/utils'
import { AsyncCellRenderer, AsyncCellRendererParams } from '../ag-grid'

export interface DataTableCategory {
  label: string
  value: string
  icon: string
}

@Injectable()
export class DataTableAdapterOptions<T> {
  /**
   * Optional source basewhere entities should be pulled from
   *
   * @remarks
   * If not given an adapter should use its own source
   */
  source?: Observable<T[]>
  /**
   * Optional persist key
   */
  persistStateId?: string
  /**
   * Optional base grid configuration.
   */
  defaultGridOptions?: GridOptions<T>
}

export function dataTableProvider<T>(options: {
  adapter: Type<DataTableAdapter<T>>
  options?: DataTableAdapterOptions<T>
}): Array<StaticProvider | ClassProvider> {
  const result: Array<StaticProvider | ClassProvider> = []
  result.push({
    provide: options.adapter,
  })
  result.push({
    provide: DataTableAdapter,
    useExisting: options.adapter,
  })
  if (options.options) {
    result.push({
      provide: DataTableAdapterOptions,
      useValue: options.options,
    })
  }
  return result
}

export abstract class DataTableAdapter<T> {

  public moneyFormatter = Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: 2,
  })

  public abstract entityID(item: T): string | number
  public abstract entityCategory(item: T): string | DataTableCategory | Array<string | DataTableCategory>
  public abstract options: Observable<GridOptions>
  public abstract entities: Observable<T[]>
  public readonly categories: Observable<DataTableCategory[]> = defer(() => this.entities)
    .pipe(map((items) => this.extractCategories(items)))
    .pipe(shareReplayRefCount())
  public readonly transaction?: Observable<RowDataTransaction>
  public readonly category = new BehaviorSubject<string>(null)
  public readonly select = new Subject<string[]>()
  public readonly grid = defer(() => this.grid$)
  public get persistStateId(): string {
    return null
  }

  private grid$ = new ReplaySubject<AgGridCommon<any>>(1)
  public setGrid(grid: AgGridCommon<any>) {
    this.grid$.next(grid)
  }

  public fieldName(k: keyof T) {
    return String(k)
  }
  public valueGetter(fn: keyof T | ((params: ValueGetterParams<T>) => any)): string | ValueGetterFunc {
    return fn as any
  }
  public valueFormatter<V>(fn: keyof T | ((params: ValueFormatterParams<T, V>) => any)): string | ValueFormatterFunc {
    return fn as any
  }
  public colDef(data: ColDef & Required<Pick<ColDef, 'colId' | 'headerValueGetter'>>): ColDef {
    return data
  }
  public cellRenderer(fn: ICellRendererFunc<T>) {
    return fn
  }
  public cellRendererAsync(): Type<AsyncCellRenderer<T>> {
    return AsyncCellRenderer
  }
  public cellRendererAsyncParams<R>(params: AsyncCellRendererParams<T, R>) {
    return params
  }

  public cellRendererTags(format?: (value: any) => string) {
    return this.cellRenderer(({ value }) => {
      return this.createElement({
        tag: 'div',
        classList: ['flex', 'flex-row', 'flex-wrap', 'gap-1', 'items-center'],
        children: value?.map((it: string) => {
          return {
            tag: 'span',
            classList: ['badge', 'badge-sm', 'badge-secondary', 'bg-secondary', 'bg-opacity-50', 'px-1'],
            text: format ? format(it) : it,
          }
        }),
      })
    })
  }

  public extractCategories(entities: T[]) {
    const categories = new Map<string, DataTableCategory>()
    entities.forEach((item) => {
      const itemCats = convertCategory(this.entityCategory(item))
      itemCats?.forEach((itemCat) => {
        if (!itemCat || categories.has(itemCat?.value)) {
          return
        }
        categories.set(itemCat.value, itemCat)
      })
    })
    return Array.from(categories.values())
  }

  public createIcon(cb: (el: HTMLPictureElement, img: HTMLImageElement) => void) {
    return this.createElement('picture', (el) => {
      const img = this.createElement('img', (img) => {
        img.classList.add('fade')
        img.onerror = () => {
          img.classList.remove('show')
          img.classList.add('error')
        }
        img.onload = () => {
          img.classList.add('show')
          img.classList.remove('error')
        }
      })
      el.append(img)
      cb(el, img)
    })
  }

  public createLinkWithIcon({
    href,
    target,
    icon,
    iconClass,
    rarity,
    named
  }: {
    href: string
    target: string
    icon: string
    iconClass?: string[]
    rarity?: number
    named?: boolean
  }) {
    return this.createElement('a', (el) => {
      if (href) {
        el.href = href
        el.target = target
      }
      el.append(
        this.createIcon((pic, img) => {
          pic.classList.add('inline-block', 'w-12', 'h-12')
          if (rarity != null) {
            pic.classList.add(`nw-item-rarity-${rarity}`, 'nw-item-icon-frame', 'nw-item-icon-bg')
            if (rarity) {
              pic.prepend(this.createElement('span', (el) => {
                el.classList.add('nw-item-icon-border')
              }))
            }
          }
          if (named) {
            pic.classList.add(`named`)
          }
          if (iconClass) {
            pic.classList.add(...iconClass)
          }
          if (icon) {
            img.src = icon
          }
          img.loading = 'lazy'
        })
      )
    })
  }

  public createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T,
    cb?: (el: HTMLElementTagNameMap[T]) => void
  ): HTMLElementTagNameMap[T]
  public createElement<T extends keyof HTMLElementTagNameMap>(
    tag: CreateElementOptions<T>,
    cb?: (el: HTMLElementTagNameMap[T]) => void
  ): HTMLElementTagNameMap[T]
  public createElement<T extends keyof HTMLElementTagNameMap>(
    tag: T | CreateElementOptions<T>,
    cb?: (el: HTMLElementTagNameMap[T]) => void
  ) {
    const el = typeof tag === 'string' ? document.createElement(tag) : createElement(document, tag)
    if (cb) {
      cb(el)
    }
    return el
  }
  public el<T extends keyof HTMLElementTagNameMap>(
    tagName: TagName<T>, attr: CreateElAttrs<T>, children?: Array<HTMLElement>
  ) {
    return createEl(document, tagName, attr, children)
  }

  public makeLineBreaks(text: string) {
    return text?.replace(/\\n/gi, '<br>')
  }

  protected async txInsert(items: T[]): Promise<RowDataTransaction> {
    return {
      add: items,
    }
  }

  protected async txUpdate(items: T[]): Promise<RowDataTransaction> {
    return {
      update: items,
    }
  }

  protected async txRemove(ids: string[]): Promise<RowDataTransaction> {
    const grid = await firstValueFrom(this.grid$)
    const nodes = []
    grid.api.forEachNode((node) => {
      if (ids.includes(this.entityID(node.data) as string)) {
        nodes.push(node.data)
      }
    })
    return {
      remove: nodes,
    }
  }

  protected async removeSelected() {
    const grid = await firstValueFrom(this.grid$)
    grid.api.applyTransactionAsync({
      remove: grid.api.getSelectedRows(),
    })
  }
}

function convertCategory(catSet: string | DataTableCategory | Array<string | DataTableCategory>): DataTableCategory[] {
  if (!catSet) {
    return []
  }
  if (!Array.isArray(catSet)) {
    catSet = [catSet]
  }
  return catSet.map((it) => {
    if (typeof it === 'string') {
      return {
        value: it,
        label: it,
        icon: null,
      }
    }
    return it
  })
}
