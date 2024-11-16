import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { StatusEffectCategoryData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { extractLimits, selectLimitsTable } from './utils'

export interface StatusEffectCategoryDetailState {
  categoryId: string
  category: StatusEffectCategoryData
  categories: StatusEffectCategoryData[]
}

export const StatusEffectCategoryDetailStore = signalStore(
  withState<StatusEffectCategoryDetailState>({
    categoryId: null,
    category: null,
    categories: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async (categoryId: string) => {
        return {
          categoryId,
          category: await db.statusEffectCategoriesById(categoryId),
          categories: await db.statusEffectCategoriesAll(),
        }
      },
    }
  }),
  withComputed(({ category, categories }) => {
    const limits = computed(() => extractLimits(category()))
    const table = computed(() => selectLimitsTable(category(), categories()))
    return {
      limits: limits,
      table: table,
      hasLimits: computed(() => !!table()),
    }
  }),
)
