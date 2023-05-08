import { Crafting, GameEvent, Housingitems, ItemDefinitionMaster } from "@nw-data/types"
import { CraftingStep } from "../types"

export interface CraftingStepWithAmount extends CraftingStep {
  steps?: CraftingStepWithAmount[]
  amount: number
}

export interface SummaryRow {
  recipeId: string
  itemId: string
  amount: number
}

export interface ResourceRow {
  itemId: string
  itemPrice: number
  amount: number
  amountOwned: number
  amountNeeded: number
  price: number
  ignored?: boolean
  stocked?: boolean
  link?: string | any[]
}

export const enum ResourceRowMode {
  None = 0,
  Ignore = 1,
  Stock = 2,
}

export interface SkillRow {
  id: string
  name: string
  icon: string
  xp: number
}
