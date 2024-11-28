import { computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NwTradeSkillInfo, calculateRecipeGearScore, getItemId, getItemIdFromRecipe } from '@nw-data/common'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { CharacterService, ItemInstance, injectNwData, withStateLoader } from '~/data'

import { apiResource } from '~/utils'
import { CraftingPerkSlot, loadRecipe, solveRecipeTree } from './loader/load-recipe'
import { AmountMode, CraftingStep } from './types'

export interface CraftingCalculatorState {
  recipeId: string
  recipe: CraftingRecipeData
  itemId: string
  item: MasterItemDefinitions | HouseItems
  tradeskill: NwTradeSkillInfo
  amount: number
  amountMode: AmountMode
  tree: CraftingStep
  slots: CraftingPerkSlot[]
}

export const CraftingCalculatorStore = signalStore(
  withState<CraftingCalculatorState>({
    recipeId: null,
    recipe: null,
    itemId: null,
    item: null,
    amount: 1,
    amountMode: 'net',
    tree: null,
    slots: [],
    tradeskill: null,
  }),
  withStateLoader((state) => {
    const db = injectNwData()
    return {
      load: async (recipeId: string) => {
        const { recipe, slots, tree } = await loadRecipe(db, recipeId)
        const itemId = getItemIdFromRecipe(recipe)
        const item = await db.itemOrHousingItem(itemId)
        const tradeskill = await db.tradeskillById(recipe?.Tradeskill)
        return {
          recipeId,
          recipe,
          itemId,
          item,
          tree,
          slots,
          amount: state.amount(),
          amountMode: state.amountMode(),
          tradeskill,
        }
      },
    }
  }),
  withMethods((state) => {
    const db = injectNwData()
    return {
      toggleQuantityMode: () => {
        patchState(state, { amountMode: state.amountMode() === 'gross' ? 'net' : 'gross' })
      },
      updateAmount: (amount: number) => {
        patchState(state, { amount })
      },
      updateAmountMode: (mode: AmountMode) => {
        patchState(state, { amountMode: mode })
      },
      updateStep: async (step: CraftingStep, modify: (step: CraftingStep) => CraftingStep) => {
        const tree = state.tree()
        modifyTree(tree, (it) => (it === step ? modify(it) : it))
        patchState(state, {
          tree: await solveRecipeTree(db, tree),
        })
      },
      updateSlot: (slot: CraftingPerkSlot, perkId: string, itemId: string) => {
        const slots = state.slots().map((it) => {
          if (slot !== it) {
            return it
          }
          return {
            ...it,
            modPerkId: perkId,
            modItemId: itemId,
          }
        })
        patchState(state, { slots })
      },
    }
  }),
  withComputed(({ tree, recipe, item, slots }) => {
    const db = injectNwData()
    const char = inject(CharacterService)

    const tradeSkill = computed(() => recipe()?.Tradeskill)
    const tradeSkill$ = toObservable(tradeSkill)
    const tradeSkillData = toSignal(char.tradeskillLevelData(tradeSkill$))
    const ingredientItemIds = computed(() => selectIngredientItemIds(tree()?.steps))
    const resource = apiResource({
      request: ingredientItemIds,
      loader: async ({ request }) => {
        return Promise.all(request.map((it) => db.itemOrHousingItem(it)))
      },
    })
    const gearScoreDetails = computed(() => {
      return calculateRecipeGearScore({
        item: item(),
        recipe: recipe(),
        ingredients: resource.value() || [],
        tradeskill: tradeSkillData(),
      })
    })
    const craftedGearScore = computed(() => gearScoreDetails()?.finalMax)
    const craftedPerks = computed(() => {
      const result = {}
      for (const slot of slots()) {
        result[slot.bucketKey] = slot.modPerkId
      }
      return result
    })
    return {
      gearScoreDetails,
      craftedGearScore,
      craftedPerks,
      itemInstance: computed((): ItemInstance => {
        return {
          itemId: getItemId(item()),
          gearScore: craftedGearScore(),
          perks: craftedPerks(),
        }
      })
    }
  }),
)

function selectIngredientItemIds(steps: CraftingStep[]) {
  if (!steps?.length) {
    return []
  }
  return steps
    .map(({ ingredient, selection }) => {
      if (ingredient.type === 'Item') {
        return ingredient.id
      }
      if (ingredient.type === 'Category_Only') {
        return selection
      }
      return null
    })
    .filter((it) => !!it)
}

function modifyTree(step: CraftingStep, modify: (step: CraftingStep) => CraftingStep) {
  if (!step) {
    return null
  }
  step = modify(step)
  if (step.steps?.length) {
    step.steps = step.steps.map((it) => modifyTree(it, modify)).filter((it) => !!it)
  }
  return step
}
