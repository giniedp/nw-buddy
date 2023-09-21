import { ItemDefinitionMaster, Perks } from "@nw-data/generated"

export interface ArmorsetGroup {
  key: string
  perks: Perks[]
  sets: Armorset[]
}

export interface Armorset {
  key: string
  name: string
  source: string
  tier: number
  weight: string
  perks: Perks[]
  items: ItemDefinitionMaster[]
  itemNames: string[]
}
