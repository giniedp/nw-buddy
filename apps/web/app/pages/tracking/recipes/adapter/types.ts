import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface RecipeRecord {
  recipe: CraftingRecipeData
  recipeItem: MasterItemDefinitions
  itemId: string
  item: MasterItemDefinitions | HouseItems
  ingredients: Array<{
    quantity: number
    item: MasterItemDefinitions | HouseItems
    itemId: string
  }>
}
