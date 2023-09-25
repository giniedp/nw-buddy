import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export interface RecipeRecord {
  recipe: Crafting
  recipeItem: ItemDefinitionMaster
  itemId: string
  item: ItemDefinitionMaster | Housingitems
  ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster | Housingitems
    itemId: string
  }>
}
