import { CraftingIngredientType } from '@nw-data/generated'

export type AmountMode = 'net' | 'gross'

export interface AmountDetail {
  net: number
  gross: number
  bonus: number
  bonusPercent: number
}

export interface CraftingStep {
  recipeId?: string
  ingredient: Ingredient
  selection?: string
  options?: string[]
  expand?: boolean
  steps?: CraftingStep[]
}

export interface Ingredient {
  id: string
  type: CraftingIngredientType
  quantity: number
}
