import { IDoesFilterPassParams, IFilterComp, IFilterParams, RowNode, ValueCache } from 'ag-grid-community'
import m from 'mithril'
import { humanize } from '~/core/utils'

export interface SelectboxFilterParams {
  showCondition?: boolean
  showSearch?: boolean
  conditionAND?: boolean
}
export class SelectboxFilter implements IFilterComp {
  public static params(params: SelectboxFilterParams): SelectboxFilterParams {
    return params
  }

  private el: HTMLElement
  private options: Array<{ label: string; value: string }> = []
  private conditionAND: boolean
  private searchQuery: string
  private showCondition: boolean
  private showSearch: boolean
  private state: Map<any, boolean> = new Map()
  private params: IFilterParams

  public init(params: IFilterParams & SelectboxFilterParams) {
    this.conditionAND = params.conditionAND
    this.showCondition = params.showCondition
    this.showSearch = params.showSearch

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
      'gap-2'
    )
    this.extractOptions()
    m.mount(this.el, {
      view: () => {
        return m.fragment({}, [
          this.showSearch &&
            m(SearchControl, {
              value: this.searchQuery,
              onchange: (value) => {
                console.log(value)
                this.searchQuery = value
              },
            }),
          this.showCondition &&
            m(ConditionControl, {
              checked: this.conditionAND,
              onchange: () => {
                this.conditionAND = !this.conditionAND
                this.onFilterChanged()
              },
            }),
          m(SelectControls, {
            options: this.options
              .filter((it) => {
                return !this.searchQuery || it.label.toLocaleLowerCase().includes(this.searchQuery.toLocaleLowerCase())
              })
              .map((option) => {
                return {
                  label: option.label,
                  active: this.state.get(option.value),
                  click: () => this.toggleFilter(option.value),
                }
              }),
          }),
        ])
      },
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

  private onFilterChanged() {
    m.redraw()
    this.params.filterChangedCallback()
  }

  protected extractOptions() {
    const values = new Map<any, any>()
    this.params.api.forEachLeafNode((node) => {
      const value = this.getValue(node, node.data)
      const label = this.getLabel(node, node.data, value)
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item) {
            values.set(item, humanize(item))
          }
        }
      } else if (value != null) {
        values.set(value, label)
      }
    })

    this.options = Array.from(values.entries())
      .map(([value, label]) => {
        return { label: label, value: value }
      })
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
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
      node: node,
    })
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

interface ConditionControlAttrs {
  checked: boolean
  onchange: Function
}
const ConditionControl: m.Component<ConditionControlAttrs> = {
  view: ({ attrs: { checked, onchange } }) => [
    m('div.form-control', [
      m('div.btn-group', [
        m('button.btn.btn-xs.flex-1', {
          class: !checked ? 'btn-active' : '',
          onclick: onchange,
        }, 'Any'),
        m('button.btn.btn-xs.flex-1', {
          class: checked ? 'btn-active' : '',
          onclick: onchange,
        }, 'All'),
      ])
    ]),
  ],
}

interface SearchControlAttrs {
  value: string
  onchange: (value: string) => void
}
const SearchControl: m.Component<SearchControlAttrs> = {
  view: ({ attrs: { value, onchange } }) => [
    m('div.fomr-control', [
      m('div.input-group.input-group-xs', [
        m('input.input.input-bordered.input-xs.w-full', {
          type: 'text',
          placeholder: 'search',
          value: value,
          oninput: (e: InputEvent) => {
            onchange((e.target as HTMLInputElement).value)
          },
        }),
        m('button.btn.btn-ghost.btn-xs', {
          onclick: () => onchange('')
        }, [
          m.trust(
            value
              ? '<svg class="h-4 w-4" viewBox="0 0 320 512" fill="currentColor" stroke="currentColor"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>'
              : '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>'
          ),
        ]),
      ]),
    ]),
  ],
}

interface SelectControlAttrs {
  options: Array<{ label: string; active: boolean; click: Function }>
}
const SelectControls: m.Component<SelectControlAttrs, any> = {
  view: ({ attrs: { options } }) => [
    m(
      'ul.menu.menu-compact.rounded-md.overflow-y-auto.flex-1',
      options?.map((option) => {
        return m('li', [
          m(
            'a',
            {
              class: option.active ? 'active' : '',
              onclick: option.click,
            },
            option.label
          ),
        ])
      })
    ),
  ],
}
