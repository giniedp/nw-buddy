import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export interface TrophiesRecord {
  item: ItemDefinitionMaster | Housingitems
  itemId: string
  recipe: Crafting
  ingredients: Array<{
    quantity: number
    item: ItemDefinitionMaster | Housingitems
    itemId: string
  }>
}
