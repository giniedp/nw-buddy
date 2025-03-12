import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import {
  SelectFilterGroup,
  SelectFilterValue,
  evaluateFilter,
  isValue,
  setValueData,
  toggleValue,
  toggleValueNegation,
  valueMatcher,
} from './filter'
import { GridSelectFilterOption } from './types'

export interface GridSelectFilterState {
  model: SelectFilterGroup<string | number>
  search: string
  searchEnabled: boolean
  options: GridSelectFilterOption[]
}
export type GridSelectFilterStore = typeof GridSelectFilterStore
export const GridSelectFilterStore = signalStore(
  { protectedState: false },
  withState<GridSelectFilterState>({
    search: '',
    searchEnabled: false,
    options: [],
    model: {
      type: 'group',
      children: [],
      and: false,
    },
  }),
  withComputed(({ model, options }) => {
    return {
      taggedOptions: computed(() => {
        return options().map((it) => {
          const found = findFilterForOption(model(), it)
          return {
            ...it,
            active: !!found,
            data: found?.data,
          }
        })
      }),
    }
  }),
  withComputed(({ model, taggedOptions, search }) => {
    const activeOptions = computed(() => taggedOptions().filter((it) => it.active))
    const displayOptions = computed(() => {
      const query = (search() || '').toLowerCase().trim()
      if (!query) {
        return taggedOptions()
      }
      return taggedOptions().filter((option) => {
        if (option.label != null && String(option.label).toLowerCase().includes(query)) {
          return true
        }
        if (option.id != null && String(option.id).toLowerCase().includes(query)) {
          return true
        }
        return false
      })
    })
    const displayConditions = computed(() => {
      return model()?.children?.map(({ value, negate }: SelectFilterValue<string>) => {
        const option = activeOptions().find((it) => it.id === value)
        return {
          ...option,
          negate,
        }
      })
    })
    return {
      activeOptions,
      displayOptions,
      displayConditions,
    }
  }),
  withMethods((state) => {
    return {
      isFilterActive: () => {
        return state.model()?.children?.length > 0
      },
      getModel: () => {
        const data = state.model()
        if (!data?.children?.length) {
          return null
        }
        return clone(data)
      },
      setModel: (input: SelectFilterGroup<string | number>) => {
        if (input?.type === 'group' && input?.children?.length) {
          patchState(state, { model: clone(input) })
        } else {
          patchState(state, {
            model: {
              type: 'group',
              children: [],
              and: state.model()?.and,
            },
          })
        }
      },
      doesFilterPass: (values: (string | number)[], valueMatcher: valueMatcher) => {
        const model = state.model()
        if (!model) {
          return false
        }
        return evaluateFilter(model, values, valueMatcher)
      },
      toggleSelection: (option: GridSelectFilterOption) => {
        patchState(state, ({ model }) => {
          return {
            model: toggleValue(model, option.id),
          }
        })
      },
      updateValueData: (option: GridSelectFilterOption, data: any) => {
        patchState(state, ({ model }) => {
          return {
            model: setValueData(model, option.id, data),
          }
        })
      },
      updateValueMax: (option: GridSelectFilterOption, maxValue: string) => {
        patchState(state, ({ model }) => {
          return {
            model: toggleValue(model, option.id),
          }
        })
      },
      toggleOptionNegation: (option: GridSelectFilterOption) => {
        patchState(state, ({ model }) => {
          return {
            model: toggleValueNegation(model, option.id) as any,
          }
        })
      },
      getFilterForOption: (option: GridSelectFilterOption): SelectFilterValue<string | number> => {
        return state.model()?.children?.find((it) => isValue(it) && it.value === option.id) as any
      },
    }
  }),
)

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function findFilterForOption(
  model: SelectFilterGroup<string | number>,
  option: GridSelectFilterOption,
): SelectFilterValue<string | number> {
  return model?.children?.find((it) => isValue(it) && it.value === option.id) as any
}
