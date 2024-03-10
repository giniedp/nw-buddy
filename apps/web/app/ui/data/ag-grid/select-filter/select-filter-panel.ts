import m from 'mithril'
import { svgExclamation, svgTrashCan } from '~/ui/icons/svg'
import { isValue, SelectFilterGroup, SelectFilterValue, toggleValue, toggleValueNegation } from './filter'
import { SelectFilterOptions } from './select-filter-options'
import { SelectFilterSearch } from './select-filter-search'
import { SelectFilterState } from './select-filter-state'

export interface SelectFilterItem {
  id: string | number
  label: string
  icon?: string
}

export interface SelectFilterPanelAttrs {
  enableSearch: boolean
  items: Array<SelectFilterItem>
  filter: SelectFilterGroup<string>
  onStateChange: (state: SelectFilterGroup<string>) => void
}

export const SelectFilterPanel: m.Component<SelectFilterPanelAttrs, { query: string }> = {
  view: ({ attrs: { filter, enableSearch, items, onStateChange }, state }) => {
    return m.fragment({}, [
      m(ConditionControl, {
        isAND: filter.and,
        isNOT: filter.negate,
        isDisabled: !filter.children?.length,
        onclear: () => {
          onStateChange({
            ...filter,
            children: [],
          })
        },
        onchange: () => {
          onStateChange({
            ...filter,
            and: !filter.and,
          })
        },
        onnegate: () => {
          onStateChange({
            ...filter,
            negate: !filter.negate,
          })
        },
      }),
      m(SelectFilterState, {
        items: filter.children?.map(({ value, negate }: SelectFilterValue<string>) => {
          const found = items?.find((it) => it.id === value)
          return {
            ...found,
            negate,
          }
        }),
        onClear: () => {
          onStateChange({
            ...filter,
            children: [],
          })
        },
        onRemove: (id) => {
          onStateChange({
            ...filter,
            children: filter.children.filter((it) => {
              return isValue(it) && it.value !== id
            }),
          })
        },
        onToggleComparator: (id) => onStateChange(toggleValueNegation(filter, id) as any),
      }),
      m(SelectFilterSearch, {
        show: enableSearch,
        value: state.query,
        onchange: (value) => {
          state.query = value
          m.redraw()
        },
      }),
      m(SelectFilterOptions, {
        items: filterItems(items, state.query).map((it) => {
          return {
            ...it,
            active: filter.children?.some((child) => isValue(child) && child.value === it.id),
          }
        }),
        onSelect: (item) => onStateChange(toggleValue(filter, item.id)),
      }),
    ])
  },
}

function filterItems(items: SelectFilterItem[], query: string) {
  if (!query) {
    return items
  }
  query = query.toLocaleLowerCase()
  return items.filter((it) => filterItem(it, query))
}

function filterItem(item: SelectFilterItem, query: string) {
  if (!query || !item) {
    return true
  }
  if (item.label.toLocaleLowerCase().includes(query)) {
    return true
  }
  if (typeof item.id === 'string' && item.id.toLocaleLowerCase().includes(query)) {
    return true
  }
  return false
}

interface ConditionControlAttrs {
  isAND: boolean
  isNOT: boolean
  isDisabled: boolean
  onchange: Function
  onclear: Function
  onnegate: Function
}
const ConditionControl: m.Component<ConditionControlAttrs> = {
  view: ({ attrs: { isAND, isNOT, isDisabled, onclear, onnegate, onchange } }) => {
    return m('div.form-control.flex.flex-row.gap-1', {
      class: isDisabled ? 'opacity-50' : ''
    }, [
      m('div.join', [
        m(
          'button.join-item.btn.btn-xs',
          {
            class: !isDisabled && isNOT ? 'btn-primary' : '',
            disabled: isDisabled,
            onclick: onnegate,
          },
          m('i.w-4.h-4.flex.items-center.justify-center', m.trust(svgExclamation))
        ),
      ]),
      m('div.join.flex-1', [
        m(
          'button.join-item.btn.btn-xs.flex-1',
          {
            class: !isDisabled && !isAND ? 'btn-primary' : '',
            disabled: isDisabled,
            onclick: onchange,
          },
          'OR'
        ),
        m(
          'button.join-item.btn.btn-xs.flex-1',
          {
            class: !isDisabled && isAND ? 'btn-primary' : '',
            disabled: isDisabled,
            onclick: onchange,
          },
          'AND'
        ),
      ]),
      m(
        'button.btn.btn-xs',
        {
          onclick: onclear,
          disabled: isDisabled,
        },
        m('i.w-4.h-4.flex.items-center', m.trust(svgTrashCan))
      ),
    ])
  },
}
