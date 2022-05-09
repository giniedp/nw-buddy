import { IDoesFilterPassParams, IFilterComp, IFilterParams, RowNode } from 'ag-grid-community'
import m from 'mithril'

export class SelectboxFilter implements IFilterComp {
  private el: HTMLElement
  private options: Array<{ label: string, value: string }> = []
  private conditionAND: boolean
  private state: Map<any, boolean> = new Map()
  private params: IFilterParams

  public init(params: IFilterParams) {
    this.params = params
    this.el = document.createElement('div')
    this.el.classList.add('rounded-md', 'min-w-[200px]', 'bg-base-300', 'max-h-[50vh]', 'p-2','flex', 'flex-col', 'gap-2')
    this.extractOptions()
    m.mount(this.el, {
      view: () => {
        return m.fragment({}, [
          m('div.form-control', [
            m('label.label.cursor-pointer.font-bold', [
              m('span.label-text', 'AND'),
              m('input.toggle.toggle-sm.toggle-primary', {
                type: 'checkbox',
                checked: this.conditionAND,
                onchange: () => {
                  this.toggleCondition()
                }
              })
            ])
          ]),
          m('ul.menu.menu-compact.rounded-md.overflow-y-auto.flex-1', this.options.map((option) => {
            return m('li', [
              m('a', {
                class: this.state.get(option.value) ? 'active' : '',
                onclick: () => this.toggleFilter(option.value)
              }, option.label)
            ])
          }))
        ])
      }
    })
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const value = this.getValue(params.node, params.data)
    const toCheck = Array.isArray(value) ? value : [value]
    let pass = null
    this.state.forEach((active, key) => {
      if (!active) {
        return
      }
      if (this.conditionAND) {
        pass = (pass == null || pass) && toCheck.includes(key)
      } else {
        pass = pass || toCheck.includes(key)
      }
    })
    return !!pass
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
    this.extractOptions()
    m.redraw()
  }

  public destroy(): void {
    m.mount(this.el, null)
    this.params = null
    this.el = null
  }

  private toggleFilter(value: any) {
    this.state.set(value, !this.state.get(value))
    this.onFilterChanged()
  }

  private toggleCondition() {
    this.conditionAND = !this.conditionAND
    this.onFilterChanged()
  }

  private onFilterChanged() {
    m.redraw()
    this.params.filterChangedCallback()
  }

  protected extractOptions() {
    const values = new Set<any>()
    this.params.api.forEachLeafNode((node) => {
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

