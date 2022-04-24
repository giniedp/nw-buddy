import { ICellRendererParams } from 'ag-grid-community'
import m from 'mithril'

export interface MithrilCellAttrs<T> extends ICellRendererParams {
  data: T
}
export function mithrilCell<T>(comp: m.Component<MithrilCellAttrs<T>, unknown>) {
  return class MithrilCellComponent {
    private el: HTMLElement
    private params: ICellRendererParams
    public init(params: ICellRendererParams) {
      this.params = params
      this.el = params.eParentOfValue
      m.mount(this.el, {
        view: () => m(comp, this.params)
      })
    }
    public refresh(params: ICellRendererParams) {
      this.params = params
      m.redraw()
    }
    public getGui() {
      return null
    }
    public destroy() {
      m.mount(this.el, null)
    }
  }
}
