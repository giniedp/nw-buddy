import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface JsonPriceItem {
  id: string
  item: MasterItemDefinitions | HouseItems
  price: number
  data: any
  keys: string[]
}
