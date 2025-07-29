import { computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { getCraftingYieldBonusInfo } from '@nw-data/common'
import { CharacterStore, injectNwData } from '~/data'
import { NwLinkService } from '~/nw'
import { apiResource } from '~/utils'
import { CraftingBuffStore } from '../crafting-bonus/crafting-buff.store'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { CraftingStep } from '../loader/load-recipe'
import { AmountMode } from '../types'

export interface CraftingStepState {
  step: CraftingStep
  amount: number
  amountMode: AmountMode
  showOptions: boolean
}

export const CraftingStepStore = signalStore(
  withState<CraftingStepState>({
    step: null,
    amount: 1,
    amountMode: 'net',
    showOptions: false,
  }),
  withMethods((state) => {
    const parent = inject(CraftingCalculatorStore)
    return {
      patchState: (patch: Partial<CraftingStepState>) => patchState(state, patch),
      setExpand: (value: boolean) => {
        parent.updateStep(state.step(), (step) => {
          return {
            ...step,
            expand: value,
          }
        })
      },
      setSelection: (itemId: string) => {
        parent.updateStep(state.step(), (step) => {
          return {
            ...step,
            selection: itemId,
          }
        })
      },
      expandAll: () => {
        parent.expandAll(state.step())
      },
      collapseAll: () => {
        parent.collapseAll(state.step())
      },
    }
  }),
  withComputed(({ step }) => {
    const db = injectNwData()
    const char = inject(CharacterStore)
    const buffs = inject(CraftingBuffStore)
    const link = inject(NwLinkService)
    const resource = apiResource({
      request: () => {
        return {
          recipeId: step()?.recipeId,
          itemId: step()?.ingredient?.id,
          ingredients: step()?.steps,
        }
      },
      loader: async ({ request }) => {
        const recipe = await db.recipesById(request.recipeId)
        const item = await db.itemOrHousingItem(request.itemId)
        const ingredients = await Promise.all(
          (request.ingredients || []).map((it) => {
            if (it.ingredient.type === 'Item') {
              return db.itemOrHousingItem(it.ingredient.id)
            }
            if (it.ingredient.type === 'Category_Only') {
              return db.itemOrHousingItem(it.selection)
            }
            return null
          }),
        ).then((items) => items.filter((it) => !!it))
        return {
          recipe,
          item,
          ingredients,
        }
      },
    })

    const recipe = computed(() => resource.value()?.recipe)
    const item = computed(() => resource.value()?.item)
    const ingredients = computed(() => resource.value()?.ingredients)
    const skill = computed(() => recipe()?.Tradeskill)
    const skillData = toSignal(char.tradeskillLevelData(toObservable(skill)))

    const bonusDetail = computed(() => {
      if (!step()?.expand) {
        return null
      }
      const bonus = buffs.getTradeskillBonusForYield(skill())
      return getCraftingYieldBonusInfo({
        item: item(),
        recipe: recipe(),
        ingredients: ingredients(),
        skill: skillData(),
        buffs: bonus.buffs,
        fortBuffs: bonus.fort,
      })
    })

    return {
      bonusDetail,
      recipeLink: computed(() => {
        if (!recipe()) {
          return null
        }
        return link.resourceLink({ type: 'recipe', id: recipe()?.RecipeID })
      }),
    }
  }),
  withComputed(({ step, bonusDetail, amountMode, amount }) => {
    const service = inject(CraftingCalculatorService)
    const ingredient = computed(() => step()?.ingredient)
    const ingredientType = computed(() => ingredient()?.type)
    const children = computed(() => step()?.steps)
    const hasChildren = computed(() => !!children()?.length)
    const isCurrency = computed(() => ingredientType() === 'Currency')
    const isCateogry = computed(() => ingredientType() === 'Category_Only')
    const isItem = computed(() => ingredientType() === 'Item')
    const amountDetail = computed(() => {
      return service.getCraftAmount({
        amount: amount(),
        amountMode: amountMode(),
        bonusPercent: bonusDetail()?.total || 0,
      })
    })
    return {
      itemId: computed(() => (isItem() ? ingredient()?.id : step()?.selection)),
      children,
      hasChildren,
      isCurrency,
      isCateogry,
      isItem,
      expand: computed(() => hasChildren() && step()?.expand),
      amountIsGross: computed(() => amountMode() === 'gross'),
      options: computed(() => step()?.options),
      currency: computed(() => {
        if (isCurrency()) {
          return {
            label: `ui_${ingredient().id}`,
            quantity: ingredient().quantity,
          }
        }
        return null
      }),
      amountNet: computed(() => amountDetail().net),
      amountGross: computed(() => amountDetail().gross),
      amountBonus: computed(() => amountDetail().bonus),
      amountBonusPercent: computed(() => amountDetail().bonusPercent),
    }
  }),
)
