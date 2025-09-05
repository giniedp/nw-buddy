import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { LootContextValues } from '@nw-data/common'
import { ConstrainedLootContext } from '~/nw/loot'

export interface LootGraphState {
  tableIds: string[]
  tags: string[]
  tagValues: LootContextValues
  dropChance: number
  highlight: string
  highlightPicker: boolean

  showLocked: boolean
  showChance: boolean
  showStats: boolean
  tagsEditable: boolean
}

export type LootGraphStore = typeof LootGraphStore
export const LootGraphStore = signalStore(
  { protectedState: false },
  withState<LootGraphState>({
    tableIds: null,
    tags: [],
    tagValues: {},
    dropChance: 1,
    highlight: null,
    highlightPicker: false,
    showLocked: false,
    showChance: false,
    showStats: false,
    tagsEditable: false,
  }),
  withComputed(({ tags, tagValues }) => {
    return {
      context: computed(() => {
        return ConstrainedLootContext.create({
          tags: tags(),
          values: tagValues(),
        })
      }),
    }
  }),
)
