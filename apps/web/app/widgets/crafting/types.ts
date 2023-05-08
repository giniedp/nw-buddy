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

export type IngredientType = 'Item' | 'Currency' | 'Category_Only'

export interface Ingredient {
  id: string
  type: IngredientType
  quantity: number
}
