import { ICellRendererComp, ICellRendererParams } from 'ag-grid-community'

export interface BoolValueRendererParams {
  svgTrue: string
  svgFalse: string
  click?: (params: ICellRendererParams) => void
}
export class BoolValueRenderer implements ICellRendererComp {
  public static params(params: BoolValueRendererParams) {
    return params
  }

  private el: HTMLElement
  private params: ICellRendererParams & BoolValueRendererParams
  public init(params: ICellRendererParams & BoolValueRendererParams) {
    this.el = document.createElement('div')
    this.refresh(params)
  }

  public getGui() {
    return this.el
  }

  public refresh(params: ICellRendererParams & BoolValueRendererParams) {
    this.el.removeEventListener('click', this.onClick)
    this.params = params
    this.el.innerHTML = params.value ? params.svgTrue : params.svgFalse
    if (params.click) {
      this.el.addEventListener('click', this.onClick)
    }
    return true
  }

  public destroy() {
    this.el.removeEventListener('click', this.onClick)
    this.el = null
    this.params = null
  }

  private onClick = (e: Event) => {
    if (this.params.click) {
      this.params.click(this.params)
    }
  }
}
