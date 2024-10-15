import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface RecipeRecord {
  recipe: CraftingRecipeData
  recipeItem: MasterItemDefinitions
  itemId: string
  item: MasterItemDefinitions | HouseItems
}
