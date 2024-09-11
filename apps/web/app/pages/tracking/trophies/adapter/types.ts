import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface TrophiesRecord {
  item: MasterItemDefinitions | HouseItems
  itemId: string
  recipe: CraftingRecipeData
}
