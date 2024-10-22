import { IDoesFilterPassParams, IFilterComp, IFilterParams, IRowNode } from '@ag-grid-community/core'

export class ItemTrackerFilter implements IFilterComp {
  private el: HTMLElement
  private document = document
  private options = [
    {
      value: Math.pow(2, 0),
      color: 'bg-orange-400',
    },
    {
      value: Math.pow(2, 1),
      color: 'bg-yellow-400',
    },
    {
      value: Math.pow(2, 2),
      color: 'bg-green-400',
    },
  ]
  private state: Set<number> = new Set()
  private params: IFilterParams

  public init(params: IFilterParams) {
    this.params = params
    this.el = document.createElement('ul')
    this.el.classList.add('menu', 'menu-compact', 'rounded-md', 'w-12', 'bg-base-300')
    this.renderFilter()
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const value = this.getValue(params.node, params.data)
    return (
      value &&
      this.options.some((opt) => {
        return this.state.has(value & opt.value)
      })
    )
  }

  public isFilterActive() {
    return Array.from(this.state.values()).some((it) => !!it)
  }

  public getModel(): number[] {
    const result = Array.from(this.state.values())
    return result.length ? result : null
  }

  public setModel(state: number[]) {
    state = state || []
    state = state.filter((it) => typeof it === 'number')
    this.state = new Set(state)
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
      const li = this.document.createElement('li')
      li.classList.add('py-1', 'px-2')
      this.el.append(li)
      const a = this.document.createElement('a')
      li.append(a)
      a.classList.add('w-6', 'h-6', 'mask', 'mask-star-2', 'opacity-25', 'hover:opacity-50', it.color)
      a.setAttribute('data-value', `${it.value}`)
      a.addEventListener('click', () => this.toggleFilter(it.value))
    })
  }

  private toggleFilter(value: number) {
    if (this.state.has(value)) {
      this.state.delete(value)
    } else {
      this.state.add(value)
    }
    this.updaFilterUI()
    this.params.filterChangedCallback()
  }

  private updaFilterUI() {
    this.el.querySelectorAll<HTMLElement>(`[data-value]`).forEach((it) => {
      const value = it.dataset['value']
      if (this.state.has(Number(value))) {
        it.classList.remove('opacity-25', 'hover:opacity-50')
      } else {
        it.classList.add('opacity-25', 'hover:opacity-50')
      }
    })
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
