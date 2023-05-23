import { IDoesFilterPassParams, IFilterComp, IFilterParams, RowNode } from 'ag-grid-community'
import m from 'mithril'
import { humanize } from '~/utils'
import { evaluateFilter, SelectFilterGroup } from './filter'
import { SelectFilterPanel } from './select-filter-panel'

export interface SelectFilterOption {
  id: string
  label: string
  icon?: string
}

export interface SelectFilterParams {
  showSearch?: boolean
  conditionAND?: boolean
  optionsGetter?: (node: RowNode) => SelectFilterOption[]
}

export class SelectFilter implements IFilterComp {
  public static params(params: SelectFilterParams): SelectFilterParams {
    return params
  }

  private el: HTMLElement
  private filterOptions: SelectFilterOption[] = []
  private filterState: SelectFilterGroup<string>
  private params: IFilterParams & SelectFilterParams

  public init(params: IFilterParams & SelectFilterParams) {
    this.params = params
    this.filterState = {
      type: 'group',
      and: params.conditionAND,
      children: [],
    }

    this.el = document.createElement('div')
    this.el.classList.add(
      'rounded-md',
      'min-w-[300px]',
      'bg-base-300',
      'max-h-[50vh]',
      'p-2',
      'flex',
      'flex-col',
      'gap-2'
    )

    m.mount(this.el, {
      view: () => {
        if (!this.filterOptions) {
          return m('div', 'LOADING')
        }
        return m(SelectFilterPanel, {
          enableSearch: params.showSearch,
          items: this.filterOptions,
          filter: this.filterState,
          onStateChange: (state) => {
            this.filterState = state
            this.onFilterChanged()
          },
        })
      },
    })
    setTimeout(() => this.initOptions())
  }

  public getGui() {
    return this.el
  }

  public doesFilterPass(params: IDoesFilterPassParams) {
    const nodeValue = this.getValue(params.node, params.data)
    const values = (Array.isArray(nodeValue) ? nodeValue : [nodeValue]).map(valueToId)
    return evaluateFilter(this.filterState, values)
  }

  public isFilterActive() {
    return this.filterState?.children?.length > 0
  }

  public getModel(): SelectFilterGroup<string> {
    if (!this.filterState?.children?.length) {
      return null
    }
    return JSON.parse(JSON.stringify(this.filterState))
  }

  public setModel(state: SelectFilterGroup<string>) {
    if (state?.type === 'group' && state?.children?.length) {
      this.filterState = JSON.parse(JSON.stringify(state))
    } else {
      this.filterState = {
        type: 'group',
        children: [],
        and: !!this.filterState?.and,
      }
    }
  }

  public onNewRowsLoaded() {
    this.initOptions()
  }

  public destroy(): void {
    m.mount(this.el, null)
    this.params = null
    this.el = null
  }

  private initOptions() {
    this.extractOptions()
    m.redraw()
  }

  private onFilterChanged() {
    m.redraw()
    this.params.filterChangedCallback()
  }

  protected extractOptions() {
    const getter = this.params.optionsGetter || ((node) => this.extractOptionsFromNode(node))
    const values = new Map<any, SelectFilterOption>()
    this.params.api.forEachLeafNode((node) => {
      getter(node).forEach((option) => {
        values.set(option.id, option)
      })
    })
    this.filterOptions = Array.from(values.values()).sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }

  protected extractOptionsFromNode(node: RowNode): SelectFilterOption[] {
    const value = this.getValue(node, node.data)
    if (Array.isArray(value)) {
      return value.map((it) => {
        return {
          id: valueToId(it),
          label: humanize(it),
        }
      })
    }
    return [
      {
        id: valueToId(value),
        label: this.getLabel(node, node.data, value),
      },
    ]
  }
  protected getValue(node: RowNode, data: any) {
    const result = this.params.valueGetter({
      api: this.params.api,
      colDef: this.params.colDef,
      column: this.params.column,
      columnApi: this.params.columnApi,
      context: this.params.context,
      data: data,
      getValue: (field) => node.data[field],
      node: node,
    })
    return result ?? null
  }

  private getLabel(node: RowNode, data: any, value: any) {
    const formatter = this.params.colDef.valueFormatter
    if (typeof formatter === 'function') {
      return formatter({
        api: this.params.api,
        colDef: this.params.colDef,
        column: this.params.column,
        columnApi: this.params.columnApi,
        context: this.params.context,
        data: data,
        node: node,
        value: value,
      })
    }
    return humanize(value)
  }
}

function valueToId(value: string | null) {
  return value ?? JSON.stringify(null)
}
