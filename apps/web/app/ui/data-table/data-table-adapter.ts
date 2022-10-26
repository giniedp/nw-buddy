import { ClassProvider, ExistingProvider, Type } from '@angular/core'
import { ColDef, GridOptions, ICellRendererFunc, ValueGetterFunc, ValueGetterParams } from 'ag-grid-community'
import { AgGridCommon } from 'ag-grid-community/dist/lib/interfaces/iCommon'
import { BehaviorSubject, defer, Observable, ReplaySubject } from 'rxjs'
import { createElement, CreateElementOptions } from '~/utils'
import { AsyncCellRenderer, AsyncCellRendererParams } from '../ag-grid'

export abstract class DataTableAdapter<T> {
  public static provideClass(useClass: Type<DataTableAdapter<any>>): ClassProvider {
    return {
      provide: DataTableAdapter,
      useClass: useClass,
    }
  }

  public static provideExisting(useClass: Type<DataTableAdapter<any>>): ExistingProvider {
    return {
      provide: DataTableAdapter,
      useExisting: useClass,
    }
  }

  public moneyFormatter = Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: 2,
  })

  public abstract entityID(item: T): string | number
  public abstract entityCategory(item: T): string
  public abstract options: Observable<GridOptions>
  public abstract entities: Observable<T[]>
  public readonly category = new BehaviorSubject<string>(null)
  public readonly grid = defer(() => this.grid$)
  public get persistStateId(): string {
    return null
  }

  private grid$ = new ReplaySubject<AgGridCommon<any>>(1)
  public setGrid(grid: AgGridCommon<any>) {
    this.grid$.next(grid)
  }

  public getActiveCategories(): string[] {
    return []
  }
  public registerInstance() {

  }
  public fieldName(k: keyof T) {
    return String(k)
  }
  public valueGetter(fn: keyof T | ((params: ValueGetterParams<T>) => any)): string | ValueGetterFunc {
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
        classList: ['flex', 'flex-row', 'flex-wrap', 'gap-1', 'h-full', 'items-center'],
        children: value?.map((it: string) => {
          return {
            tag: 'span',
            classList: ['badge', 'badge-sm', 'badge-secondary', 'bg-secondary', 'bg-opacity-50'],
            text: format ? format(it) : it,
          }
        }),
      })
    })
  }

  public extractCategories(entities: T[]) {
    return Array.from(new Set(entities.map((it) => this.entityCategory(it)).filter((it) => !!it)))
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
  }: {
    href: string
    target: string
    icon: string
    iconClass?: string[]
    rarity?: number
  }) {
    return this.createElement('a', (el) => {
      el.target = target
      el.href = href
      el.append(
        this.createIcon((pic, img) => {
          pic.classList.add('w-9', 'h-9', 'nw-icon')
          if (rarity) {
            pic.classList.add(`bg-rarity-${rarity}`)
          }
          if (iconClass) {
            pic.classList.add(...iconClass)
          }
          img.src = icon
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

  public makeLineBreaks(text: string) {
    return text?.replace(/\\n/gi, '<br>')
  }
}
