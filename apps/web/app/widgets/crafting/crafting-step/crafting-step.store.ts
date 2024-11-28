import { computed, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { AmountMode, CraftingStep } from '../types'

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
      selectOption: (itemId: string) => {
        parent.updateStep(state.step(), (step) => {
          return {
            ...step,
            selection: itemId,
          }
        })
      },
    }
  }),
  withComputed(({ step, amountMode, amount }) => {
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
        bonusPercent: 0, // TODO:
      })
    })
    return {
      itemId: computed(() => isItem() ? ingredient()?.id : step()?.selection),
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
