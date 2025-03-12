import { IDoesFilterPassParams, IFilterComp, IFilterParams, IRowNode, RowNode } from '@ag-grid-community/core'
import m from 'mithril'

export interface RangeFilterParams {
  min?: number
  max?: number
}

export class RangeFilter implements IFilterComp {
  public static params(params: RangeFilterParams): RangeFilterParams {
    return params
  }

  private el: HTMLElement
  private state = {
    min: null as number,
    max: null as number,
  }
  private params: IFilterParams

  public init(params: IFilterParams & RangeFilterParams) {
    this.params = params
    this.el = document.createElement('div')
    this.el.classList.add(
      'rounded-md',
      'min-w-[200px]',
      'bg-base-300',
      'max-h-[50vh]',
      'p-2',
      'flex',
      'flex-col',
      'gap-2',
    )
    m.mount(this.el, {
      view: () => {
        return m.fragment({}, [
          m('div.form-control', [
            m('input.input.input-bordered.input-sm', {
              type: 'number',
              placeholder: 'Min',
              value: this.state.min,
              oninput: (e: InputEvent) => {
                this.state.min = (e.target as HTMLInputElement).valueAsNumber
                this.params.filterChangedCallback()
              },
            }),
          ]),
          m('div.form-control', [
            m('input.input.input-bordered.input-sm', {
              type: 'number',
              placeholder: 'Max',
              value: this.state.max,
              oninput: (e: InputEvent) => {
                this.state.max = (e.target as HTMLInputElement).valueAsNumber
                this.params.filterChangedCallback()
              },
            }),
          ]),
        ])
      },
    })
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const value = this.getValue(params.node, params.data)
    let min: number
    let max: number
    if (typeof value === 'number') {
      min = value
      max = value
    } else if (Array.isArray(value)) {
      min = Number(value[0])
      max = Number(value[1])
    } else if (typeof value === 'string') {
      min = Number(value.split('-')[0])
      max = Number(value.split('-')[1])
    }
    if (this.state.max && min > this.state.max) {
      return false
    }
    if (this.state.min && max < this.state.min) {
      return false
    }
    return min != null && max != null
  }

  public isFilterActive() {
    return !!this.state.min || !!this.state.max
  }

  public getModel() {
    return {
      ...this.state,
    }
  }

  public setModel(state: { min: number; max: number }) {
    this.state = {
      min: state?.min,
      max: state?.max,
    }
  }

  public onNewRowsLoaded() {
    m.redraw()
  }

  public destroy(): void {
    m.mount(this.el, null)
    this.params = null
    this.el = null
  }

  protected getValue(node: IRowNode, data: any) {
    return this.params.valueGetter({
      api: this.params.api,
      colDef: this.params.colDef,
      column: this.params.column,
      columnApi: this.params.columnApi,
      context: this.params.context,
      data: data,
      getValue: (field) => node.data[field],
      node: node,
    })
  }
}
