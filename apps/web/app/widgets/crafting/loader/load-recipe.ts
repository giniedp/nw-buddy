import { getCraftingIngredients, getItemIdFromRecipe, getItemPerkSlots } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingIngredientType, CraftingRecipeData, PerkType } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface CraftingStep {
  recipeId?: string
  ingredient: Ingredient
  selection?: string
  options?: string[]
  expand?: boolean
  steps?: CraftingStep[]
  slots?: CraftingPerkSlot[]
}

export interface Ingredient {
  id: string
  type: CraftingIngredientType
  quantity: number
  ref: string
}

export interface CraftingPerkSlot {
  bucketKey: string
  bucketId: string
  bucketType: PerkType
  modItemId: string
  modPerkId: string
  canCraft: boolean
}

export interface LoadedRecipe {
  recipe: CraftingRecipeData
  slots: CraftingPerkSlot[]
  tree: CraftingStep
}
export async function loadRecipe(db: NwData, recipeId: string, state: CraftingStep): Promise<LoadedRecipe> {
  const recipe = await db.recipesById(recipeId)
  if (!recipe) {
    return {
      recipe: null,
      slots: [],
      tree: null,
    }
  }
  return {
    recipe: recipe,
    slots: await solvePerkSlots({ db, recipe }),
    tree:
      state ||
      (await solveRecipeTree(db, {
        recipeId: recipe.RecipeID,
        expand: true,
        ingredient: {
          id: getItemIdFromRecipe(recipe),
          quantity: 1,
          type: 'Item',
          ref: '0',
        },
      })),
  }
}

export async function solveRecipeTree(db: NwData, step: CraftingStep) {
  return solveIngredient({ db, step, trace: [] })
}

async function solvePerkSlots({ db, recipe }: { db: NwData; recipe: CraftingRecipeData }): Promise<CraftingPerkSlot[]> {
  const itemId = getItemIdFromRecipe(recipe)
  const item = await db.itemsById(itemId)
  const slots = getItemPerkSlots(item)
  const result: CraftingPerkSlot[] = []
  let attrAllowed = recipe.AttributeOnlyPerkItemSlotCount ?? 0
  let perkAllowed = recipe.MaxPerkItemsAllowed
  if (!perkAllowed && recipe.IsProcedural) {
    perkAllowed = 1
  }
  for (const slot of slots) {
    if (!slot.bucketKey) {
      continue
    }
    const bucket = await db.perkBucketsById(slot.bucketId)
    const craftSlot: CraftingPerkSlot = {
      bucketKey: slot.bucketKey,
      bucketId: slot.bucketId,
      bucketType: bucket.PerkType,
      modItemId: null,
      modPerkId: null,
      canCraft: false,
    }
    if (craftSlot.bucketType === 'Inherent' && attrAllowed) {
      attrAllowed--
      craftSlot.canCraft = true
    }
    if (craftSlot.bucketType === 'Generated' && perkAllowed) {
      perkAllowed--
      craftSlot.canCraft = true
    }
    result.push(craftSlot)
  }
  return result
}

async function solveIngredient({
  db,
  step,
  trace,
}: {
  db: NwData
  step: CraftingStep
  trace: string[]
}): Promise<CraftingStep> {
  if (step.ingredient.type === 'Item') {
    return solveSteps({ db, step, trace: [...trace] })
  }
  if (step.ingredient.type === 'Category_Only') {
    const items = await db.itemsByIngredientCategory(step.ingredient.id)
    const itemIds = (items || []).map((it) => it.ItemID)
    const selection = itemIds.find((it) => eqCaseInsensitive(it, step.selection)) || itemIds[0]
    step = {
      ...step,
      options: itemIds,
      selection,
    }
    return solveSteps({ db, step, trace: [...trace] })
  }
  return {
    recipeId: null,
    ingredient: step.ingredient,
  }
}

async function solveSteps({
  db,
  step,
  trace,
}: {
  db: NwData
  step: CraftingStep
  trace: string[]
}): Promise<CraftingStep> {
  const loopKey = `${step.recipeId}-${step.ingredient?.id}-${step.ingredient?.type}#${step.ingredient?.ref}`
  if (trace.includes(loopKey)) {
    return {
      ...step,
      steps: null,
      recipeId: null,
    }
  }
  trace.push(loopKey)
  const { recipeId, ingredients } = await fetchIngredientsForStep(db, step)
  return {
    ...step,
    recipeId,
    steps: await Promise.all(
      ingredients.map((it) => {
        const state = step.steps?.find(
          (step) => eqCaseInsensitive(step.ingredient?.id, it.id) && eqCaseInsensitive(step.ingredient?.ref, it.ref),
        )
        return solveIngredient({
          db,
          step: {
            ...(state || {}),
            recipeId: null,
            ingredient: it,
          },
          trace: [...trace],
        })
      }),
    ),
  }
}

async function fetchIngredientsForStep(db: NwData, step: CraftingStep) {
  if (step.recipeId) {
    const recipe = await db.recipesById(step.recipeId)
    return {
      recipeId: step.recipeId,
      ingredients: getCraftingIngredients(recipe).map(
        (it): Ingredient => ({
          id: it.ingredient,
          type: it.type,
          quantity: it.quantity,
          ref: it.ref,
        }),
      ),
    }
  }
  let itemId = step.ingredient.id
  if (step.options) {
    itemId = step.selection
  }
  const recipes = (await db.recipesByItemId(itemId)) || []
  const recipe = recipes.find((it) => !!it && it.CraftingCategory !== 'MaterialConversion' && !!it.OutputQty)
  return {
    itemId,
    recipeId: recipe?.RecipeID,
    ingredients: getCraftingIngredients(recipe).map(
      (it): Ingredient => ({
        id: it.ingredient,
        type: it.type || 'Item',
        quantity: it.quantity,
        ref: it.ref,
      }),
    ),
  }
}
