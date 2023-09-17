import { ICellRendererParams } from '@ag-grid-community/core'
import m from 'mithril'
import { Observable, Subject } from 'rxjs'

export interface MithrilCellAttrs<T> extends ICellRendererParams {
  data: T
  destroy$: Observable<any>
}
export function mithrilCell<T, S = any>(comp: m.Component<MithrilCellAttrs<T>, S>) {
  return class MithrilCellComponent {
    private el: HTMLElement
    private params$: ICellRendererParams
    private destroy$ = new Subject()
    public init(params: ICellRendererParams) {
      this.params$ = params
      this.el = params.eParentOfValue
      m.mount(this.el, {
        view: () =>
          m(comp, {
            ...this.params$,
            destroy$: this.destroy$,
          }),
      })
    }
    public refresh(params: ICellRendererParams) {
      this.params$ = params
      m.redraw()
    }
    public getGui() {
      return null
    }
    public destroy() {
      this.destroy$.next(null)
      this.destroy$.complete()
      m.mount(this.el, null)
    }
  }
}
