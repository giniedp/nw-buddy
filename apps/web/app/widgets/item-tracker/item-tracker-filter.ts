import { IDoesFilterPassParams, IFilterComp, IFilterParams, RowNode } from 'ag-grid-community'

export class ItemTrackerFilter implements IFilterComp {
  private el: HTMLElement
  private options = [
    {
      value: Math.pow(2, 0),
      color: 'bg-orange-400'
    },
    {
      value: Math.pow(2, 1),
      color: 'bg-yellow-400'
    },
    {
      value: Math.pow(2, 2),
      color: 'bg-green-400'
    }
  ]
  private state: Map<number, boolean> = new Map()
  private params: IFilterParams

  public init(params: IFilterParams) {
    this.params = params
    this.el = document.createElement('ul')
    this.el.classList.add('menu','menu-compact', 'rounded-md', 'w-12', 'bg-base-300')
    this.renderFilter()
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const value = this.getValue(params.node, params.data)
    return value && this.options.some((opt) => {
      return this.state.get(value & opt.value)
    })
  }

  public isFilterActive() {
    return Array.from(this.state.values()).some((it) => !!it)
  }

  public getModel() {
    return new Array(this.state.entries())
  }

  public setModel(state: Array<[any, boolean]>) {
    this.state = new Map(state)
  }

  public onNewRowsLoaded() {
    this.renderFilter()
    this.updaFilterUI()
  }

  public destroy(): void {
    this.params = null
    this.el = null
  }

  private renderFilter() {
    this.el.innerHTML = ''
    this.options.map((it) => {
      const li = document.createElement('li')
      li.classList.add('py-1', 'px-2')
      this.el.append(li)
      const a = document.createElement('a')
      li.append(a)
      a.classList.add('w-6','h-6','mask','mask-star-2', 'opacity-25', 'hover:opacity-50', it.color)
      a.setAttribute('filter-value', `${it.value}`)
      a.addEventListener('click', () => this.toggleFilter(it.value))
    })
  }

  private toggleFilter(value: number) {
    this.state.set(value, !this.state.get(value))
    this.updaFilterUI()
    this.params.filterChangedCallback()
  }

  private updaFilterUI() {
    this.state.forEach((value, key) => {
      const el = this.el.querySelector(`[filter-value="${key}"]`)
      if (!el) {
        return
      }
      if (value) {
        el.classList.remove('opacity-25', 'hover:opacity-50')
      } else {
        el.classList.add('opacity-25', 'hover:opacity-50')
      }
    })
  }

  protected getValue(node: RowNode, data: any) {
    return this.params.valueGetter({
      api: this.params.api,
      colDef: this.params.colDef,
      column: this.params.column,
      columnApi: this.params.columnApi,
      context: this.params.context,
      data: data,
      getValue: (field) => node.data[field],
      node: node
    })
  }
}
