import { MasterItemDefinitions, PerkData } from '@nw-data/generated'

export interface ArmorsetGroup {
  key: string
  perks: PerkData[]
  sets: Armorset[]
}

export interface Armorset {
  key: string
  name: string
  source: string
  tier: number
  weight: string
  perks: PerkData[]
  items: MasterItemDefinitions[]
  itemNames: string[]
}
