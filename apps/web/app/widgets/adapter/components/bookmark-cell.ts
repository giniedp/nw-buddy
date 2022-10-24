import { AgPromise, ICellRendererComp, ICellRendererParams } from 'ag-grid-community'
import { map, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'
import { createElement } from '~/utils'

export interface BookmarkCellParams<T> {
  getId: (item: T) => string
  pref: ItemPreferencesService
}

export class BookmarkCell<T> implements ICellRendererComp<T> {
  public static params<T>(params: BookmarkCellParams<T>) {
    return params
  }

  private item$ = new ReplaySubject<T>(1)
  private destroy$ = new Subject<void>()
  private el: HTMLElement
  private valueKey = null
  private value = 0
  private model = ['bg-orange-400', 'bg-yellow-400', 'bg-green-400'].map((color, i) => {
    return {
      index: i,
      color: color,
      value: Math.pow(2, i),
      checked: false,
      el: null as HTMLElement,
    }
  })
  private params: BookmarkCellParams<T>

  public getGui(): HTMLElement {
    return this.el
  }
  public destroy(): void {
    this.destroy$.next()
  }
  public init(params: ICellRendererParams<T, any> & BookmarkCellParams<T>): void | AgPromise<void> {
    this.params = params
    this.el = createElement(document, {
      tag: 'div',
      classList: ['flex', 'flex-row', 'h-full', 'items-center', 'justify-center', 'gap-1'],
      children: this.model.map((item) => {
        return {
          tag: 'div',
          classList: [
            'w-5',
            'h-5',
            'cursor-pointer',
            'mask',
            'mask-star-2',
            'transition-all',
            'scale-100',
            'hover:scale-125',
            'opacity-25',
            item.color
          ],
          tap: (el) => {
            el.onclick = (e) => {
              e.preventDefault()
              this.toggle(item.index)
            }
            item.el = el
          },

        }
      }),
    })

    this.item$.next(params.data)
    this.item$
      .pipe(map((it) => params.getId(it)))
      .pipe(switchMap((it) => params.pref.observe(it)))
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.valueKey = it?.id
        this.value = it?.meta?.mark || 0
        this.updateUI()
      })
  }

  public refresh(params: ICellRendererParams<T, any>): boolean {
    this.item$.next(params.data)
    return true
  }

  private toggle(index: number) {
    let result = this.value
    const item = this.model[index]
    if (item.checked) {
      result = result & ~item.value
    } else {
      result = result | item.value
    }
    this.value = result
    this.write()
  }

  private updateUI() {
    for (const item of this.model) {
      item.checked = !!(this.value & item.value)
      if (item.checked) {
        item.el.classList.remove('opacity-25')
      } else {
        item.el.classList.add('opacity-25')
      }
    }
  }

  private write() {
    if (this.valueKey) {
      this.params.pref.merge(this.valueKey, {
        mark: this.value,
      })
    }
  }
}
