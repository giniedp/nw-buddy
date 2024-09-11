import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface RunesRecord {
  item: MasterItemDefinitions | HouseItems
  itemId: string
  recipe: CraftingRecipeData
}
