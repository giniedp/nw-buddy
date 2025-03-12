import { ItemPerkSlot } from '@nw-data/common'
import { ItemClass, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { ItemInstance } from '~/data'

export type TranslateFn = (key: string) => string

export interface PoolItem {
  item: MasterItemDefinitions
  name: string
  slots: ItemPerkSlot[]
}

export interface PoolPerk {
  name: string
  perk: PerkData
  suffix?: string
  prefix?: string
  mods?: Array<{ label: string; value: string }>
  rating?: number
}

export interface ScanSample {
  file: string
  itemClass: ItemClass[]
  scan: {
    name: string
    type: string
    rarity: string
    gearScore: number
    attributes: string[]
    perks: string[]
  }
  instance: ItemInstance
}
