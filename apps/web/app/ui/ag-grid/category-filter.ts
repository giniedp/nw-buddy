import { ColumnApi, GridApi, IDoesFilterPassParams, IFilterComp, IFilterParams, RowNode } from 'ag-grid-community'

export class CategoryFilter<C> implements IFilterComp {
  private el: HTMLElement
  private options: Array<{ label: string, value: string }> = []
  private state: Map<any, boolean> = new Map()
  private params: IFilterParams

  public init(params: IFilterParams) {
    this.params = params
    this.el = document.createElement('ul')
    this.el.classList.add('menu','menu-compact', 'rounded-md', 'min-w-[200px]', 'bg-base-300')
    this.renderFilter()
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {

    const value = this.getValue(params.node, params.data)
    if (!Array.isArray(value)) {
      return !!this.state.get(value)
    }
    return value.some((it) => this.state.get(it))
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
  }

  public destroy(): void {
    this.params = null
    this.el = null
  }

  private renderFilter() {
    this.extractOptions()
    this.el.innerHTML = ''
    this.options.map((it) => {
      const li = document.createElement('li')
      this.el.append(li)
      const a = document.createElement('a')
      li.append(a)

      a.setAttribute('filter-value', `${it.value}`)
      a.textContent = it.label
      a.addEventListener('click', () => {
        this.toggleFilter(it.value)
      })
    })
  }

  private toggleFilter(value: any) {
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
        el.classList.add('active')
      } else {
        el.classList.remove('active')
      }
    })
  }

  protected extractOptions() {
    const values = new Set<any>()
    this.params.api.forEachNode((node) => {
      const value = this.getValue(node, node.data)
      const list = Array.isArray(value) ? value : [value]
      for (const item of list) {
        if (item) {
          values.add(item)
        }
      }
    })
    this.options = Array.from(values.values()).sort().map((it) => {
      return { label: it, value: it }
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
