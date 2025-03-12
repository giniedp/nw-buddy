import { CraftingTradeskill } from '@nw-data/generated'

export type CraftingBuffType = 'gs' | 'yld' | 'exp'

export interface CraftingBuffGroup {
  group: CraftingTradeskill | 'TerritoryStanding' | 'FactionControl'
  name: string
  buffType: CraftingBuffType
  items: CraftingBuffCategory[]
}

export interface CraftingBuffCategory {
  category: string
  name: string
  maxStack: number
  items: CraftingBuff[]
}

export interface CraftingBuff {
  setting: string // effect, perk or faction buff ID. pray and hope there is no collision between them.
  icon: string
  name: string
  description: string
  value: number
  scalingPerGS: string
}
