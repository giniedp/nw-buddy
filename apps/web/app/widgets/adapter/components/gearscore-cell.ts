import { AgPromise, ICellRendererComp, ICellRendererParams } from '@ag-grid-community/core'
import { combineLatest, map, of, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { CharacterStore } from '~/data'
import { createElement } from '~/utils'

export interface TrackGsCellParams<T> {
  getId: (item: T) => string
  character: CharacterStore

  class?: string
  classEmpty?: string
  emptyText?: string
  emptyTip?: string
  multiply?: number
  onchange?: () => void
  formatter?: Intl.NumberFormat
}

export class TrackGsCell<T> implements ICellRendererComp<T> {
  public static params<T>(params: TrackGsCellParams<T>) {
    return params
  }

  private item$ = new ReplaySubject<T>(1)
  private destroy$ = new Subject<void>()
  private el: HTMLElement

  private trackedId: string
  private trackedValue: any
  private showInput: boolean

  private multiply = 1
  private emptyText = '✏️'
  private emptyTip = 'Edit'

  private params: TrackGsCellParams<T>

  private view: HTMLElement
  private input: HTMLInputElement

  public getGui(): HTMLElement {
    return this.el
  }
  public destroy(): void {
    this.destroy$.next()
  }
  public init(params: ICellRendererParams<T, any> & TrackGsCellParams<T>): void | AgPromise<void> {
    this.params = params
    this.el = createElement(document, {
      tag: 'div',
      classList: ['text-right'],
    })
    this.view = createCell(document)
    this.view.onclick = () => this.editOpen()
    this.input = createInput(document, {
      change: (value) => {
        this.trackedValue = value
        this.write()
      },
      close: () => this.editClose(),
    })

    this.item$.next(params.data)
    this.item$
      .pipe(map((it) => params.getId(it)))
      .pipe(
        switchMap((it) => {
          return combineLatest({
            id: of(it),
            value: params.character.observeItemGearScore(it),
          })
        }),
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((it) => {
        this.trackedId = it.id
        this.trackedValue = cleanValue(it.value)
        this.updateUI()
      })
  }

  public refresh(params: ICellRendererParams<T, any>): boolean {
    this.item$.next(params.data)
    return true
  }

  private updateUI() {
    if (this.showInput) {
      this.updateInput()
    } else {
      this.updateView()
    }
  }

  private updateView() {
    if (this.input.parentElement) {
      this.input.remove()
    }
    this.el.append(this.view)
    const attrs = this.params
    const isEmpty = !(this.trackedValue > 0)
    const tip = attrs.emptyTip ?? this.emptyTip
    const value = this.trackedValue * this.multiply
    const result = attrs.formatter ? attrs.formatter.format(value) : value

    this.view.dataset['tip'] = tip
    this.view.textContent = isEmpty ? this.emptyText : String(result)
    if (isEmpty) {
      this.view.classList.add('tip', 'opacity-25')
      this.view.classList.add(...(attrs.classEmpty || []))
    } else {
      this.view.classList.remove('tip', 'opacity-25')
      this.view.classList.remove(...(attrs.classEmpty || []))
    }
  }

  private updateInput() {
    if (this.view.parentElement) {
      this.view.remove()
    }
    this.el.append(this.input)
    this.input.value = this.trackedValue
  }

  private editOpen() {
    this.showInput = true
    this.updateUI()
    this.input.select()
  }

  private editClose() {
    this.showInput = false
    this.updateUI()
  }
  private write() {
    if (this.trackedId) {
      this.params.character.setItemGearScore(this.trackedId, this.trackedValue)
    }
  }
}

function createCell(document: Document) {
  return createElement(document, {
    tag: 'div',
    classList: ['w-full', 'cursor-pointer', 'transition-opacity', 'hover:opacity-100'],
  })
}

function createInput(document: Document, { close, change }: { close: () => void; change: (value: number) => void }) {
  return createElement(document, {
    tag: 'input',
    classList: ['input', 'input-ghost', 'input-xs', 'rounded-none', 'px-0', 'w-full'],
    tap: (el) => {
      el.type = 'number'
      el.onchange = () => {
        change(cleanValue(el.value))
      }
      el.onblur = () => {
        close()
      }
      el.onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          close()
        }
      }
    },
  })
}

function cleanValue(value: string | number | boolean) {
  if (typeof value !== 'number') {
    value = Number(value)
  }
  if (Number.isFinite(value)) {
    return value
  }
  return null
}
