import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NW_MAX_ENEMY_LEVEL } from '@nw-data/common'
import { FilterSpecification, LegacyFilterSpecification } from 'maplibre-gl'

export interface FilterVitalsState {
  minLevel: number
  maxLevel: number
  joinOperators: JoinOperator[]

  typeOperators: JoinOperator[]
  typeOperator: string
  typeFilters: StringFilter[]

  categoryOperators: JoinOperator[]
  categoryOperator: string
  categoryFilters: StringFilter[]

  lootOperators: JoinOperator[]
  lootOperator: string
  lootFilters: StringFilter[]
}

export interface JoinOperator {
  value: string
  label: string
}
export interface StringFilter {
  key: string
  operator: string
  value: string
  label: string
}

export const FilterVitalsStore = signalStore(
  withState<FilterVitalsState>({
    minLevel: 1,
    maxLevel: NW_MAX_ENEMY_LEVEL,
    joinOperators: [
      {
        value: 'all',
        label: 'AND',
      },
      {
        value: 'any',
        label: 'OR',
      },
    ],
    typeOperators: [
      {
        value: '==',
        label: '==',
      },
      {
        value: '!=',
        label: '!=',
      },
    ],
    typeOperator: 'any',
    typeFilters: [],

    categoryOperators: [
      {
        value: 'in',
        label: 'has',
      },
      {
        value: '!in',
        label: '!has',
      },
    ],
    categoryOperator: 'all',
    categoryFilters: [],

    lootOperators: [
      {
        value: 'in',
        label: 'has',
      },
      {
        value: '!in',
        label: '!has',
      },
    ],
    lootOperator: 'all',
    lootFilters: [],
  }),
  withMethods((state) => {
    return {
      setMinLevel(level: number) {
        patchState(state, {
          minLevel: level,
        })
      },
      setMaxLevel(level: number) {
        patchState(state, {
          maxLevel: level,
        })
      },
      setTypeOperator(operator: string) {
        patchState(state, {
          typeOperator: operator,
        })
      },
      removeTypeFilter(index: number) {
        patchState(state, ({ typeFilters }) => {
          typeFilters = [...typeFilters]
          typeFilters.splice(index, 1)
          return {
            typeFilters,
          }
        })
      },
      updateTypeFilter(index: number, data: Partial<StringFilter>) {
        patchState(state, ({ typeFilters }) => {
          typeFilters = [...typeFilters]
          typeFilters[index] = {
            ...typeFilters[index],
            ...data,
          }
          return {
            typeFilters,
          }
        })
      },
      addTypeFilter(data?: StringFilter) {
        patchState(state, ({ typeFilters }) => {
          typeFilters = [...typeFilters]
          if (!data) {
            data = {
              ...(typeFilters[typeFilters.length - 1] || {
                key: 'type',
                operator: '==',
                value: '',
                label: '',
              }),
            }
          }
          typeFilters.push(data)
          return {
            typeFilters,
          }
        })
      },

      setCategoryOperator(operator: string) {
        patchState(state, {
          categoryOperator: operator,
        })
      },
      removeCategoryFilter(index: number) {
        patchState(state, ({ categoryFilters }) => {
          categoryFilters = [...categoryFilters]
          categoryFilters.splice(index, 1)
          return {
            categoryFilters,
          }
        })
      },
      updateCategoryFilter(index: number, data: Partial<StringFilter>) {
        patchState(state, ({ categoryFilters }) => {
          categoryFilters = [...categoryFilters]
          categoryFilters[index] = {
            ...categoryFilters[index],
            ...data,
          }
          console.log('categoryFilters', categoryFilters)
          return {
            categoryFilters,
          }
        })
      },
      addCategoryFilter(data?: StringFilter) {
        patchState(state, ({ categoryFilters }) => {
          categoryFilters = [...categoryFilters]
          if (!data) {
            data = {
              ...(categoryFilters[categoryFilters.length - 1] || {
                key: 'categories',
                operator: 'in',
                value: '',
                label: '',
              }),
            }
          }
          categoryFilters.push(data)
          return {
            categoryFilters,
          }
        })
      },

      setLootOperator(operator: string) {
        patchState(state, {
          lootOperator: operator,
        })
      },
      removeLootFilter(index: number) {
        patchState(state, ({ lootFilters }) => {
          lootFilters = [...lootFilters]
          lootFilters.splice(index, 1)
          return {
            lootFilters,
          }
        })
      },
      updateLootFilter(index: number, data: Partial<StringFilter>) {
        patchState(state, ({ lootFilters }) => {
          lootFilters = [...lootFilters]
          lootFilters[index] = {
            ...lootFilters[index],
            ...data,
          }
          return {
            lootFilters,
          }
        })
      },
      addLootFilter(data?: StringFilter) {
        patchState(state, ({ lootFilters }) => {
          lootFilters = [...lootFilters]
          if (!data) {
            data = {
              ...(lootFilters[lootFilters.length - 1] || {
                key: 'lootTags',
                operator: 'in',
                value: '',
                label: '',
              }),
            }
          }
          lootFilters.push(data)
          return {
            lootFilters,
          }
        })
      },
    }
  }),
  withComputed(({ minLevel, maxLevel, typeFilters, typeOperator, categoryFilters, categoryOperator, lootFilters, lootOperator }) => {
    return {
      filterSpec: computed(() => {
        const result: FilterSpecification = [
          'all',
          ['>=', ['get', 'level'], minLevel()],
          ['<=', ['get', 'level'], maxLevel()],
        ]
        if (typeFilters().length) {
          const filters = typeFilters().map((it): LegacyFilterSpecification => {
            return [it.operator as 'has', ['get', it.key], it.value] as any
          })
          const filter = [typeOperator(), ...filters]
          result.push(filter as any)
        }
        if (categoryFilters().length) {
          const filters = categoryFilters().map((it) => {
            return [it.operator as 'has', it.value, ['get', it.key]] as any
          })
          const filter = [categoryOperator(), ...filters]
          result.push(filter as any)
        }
        if (lootFilters().length) {
          const filters = lootFilters().map((it) => {
            return [it.operator as 'has', it.value, ['get', it.key]] as any
          })
          const filter = [lootOperator(), ...filters]
          result.push(filter as any)
        }
        return result
      }),
    }
  }),
)
