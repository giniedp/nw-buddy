import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export interface JsonPriceItem {
  id: string
  item: ItemDefinitionMaster | Housingitems
  price: number
  data: any
  keys: string[]
}
