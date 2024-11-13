import { signalStore, withState } from '@ngrx/signals'
import { BackstoryItemInstance } from '@nw-data/common'
import { BackstoryDefinition, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { BackstoryTradeskillData, selectBackstoryTradeSkills } from './selectors'

export interface BackstoryDetailStore {
  backstoryId: string
  backstory: BackstoryDefinition
  tradeskills: BackstoryTradeskillData
  inventory: Array<BackstoryItemInstance & { item: MasterItemDefinitions | HouseItems }>
}

export const BackstoryDetailStore = signalStore(
  withState<BackstoryDetailStore>({
    backstoryId: null,
    backstory: null,
    tradeskills: [],
    inventory: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async (backstoryId: string) => {
        const backstory = await db.backstoriesById(backstoryId)
        const inventory = await db.backstoriesItemsById(backstoryId)
        const tradeskills = selectBackstoryTradeSkills(backstory)
        return {
          backstoryId,
          backstory,
          inventory,
          tradeskills,
        }
      },
    }
  }),
)
