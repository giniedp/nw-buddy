import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { SelectFilterGroup, evaluateFilter } from './filter'

export interface GridSelectFilterState {
  model: SelectFilterGroup<string | number>
}
export type GridSelectFilterStore = typeof GridSelectFilterStore
export const GridSelectFilterStore = signalStore(
  withState<GridSelectFilterState>({
    model: {
      type: 'group',
      children: [],
      and: false,
    },
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
      doesFilterPass: (values: (string | number)[]) => {
        const model = state.model()
        if (!model) {
          return false
        }
        return evaluateFilter(model, values)
      }
    }
  }),
)

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
