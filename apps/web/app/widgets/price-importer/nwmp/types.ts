import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'

export interface NwmpServerOption {
  name: string
  id: string
}

export interface NwmpPriceItem {
  id: string
  price: number
  item: MasterItemDefinitions | HouseItems
}
