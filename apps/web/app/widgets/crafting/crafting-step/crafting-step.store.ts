import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { AmountMode, CraftingStep } from '../types'

export interface CraftingStepState {
  step: CraftingStep
  amount: number
  amountMode: AmountMode
  showOptions: boolean
}

@Injectable()
export class CraftingStepStore extends ComponentStore<CraftingStepState> {
  public readonly step$ = this.select(({ step }) => step)
  public readonly isCurreny$ = this.select(({ step }) => step.ingredient?.type === 'Currency')
  public readonly children$ = this.select(({ step }) => step?.steps)
  public readonly expand$ = this.select(({ step }) => step?.expand)
  public readonly showOptions$ = this.select(({ showOptions }) => showOptions)
  public readonly amountMode$ = this.select(({ amountMode }) => amountMode)
  public readonly amountIsGross$ = this.select(this.amountMode$, (it) => it === 'gross')

  public readonly bonus$ = this.step$.pipe(
    switchMap((step) => (step?.expand ? this.service.getCraftBonus(step) : of(0))),
  )
  public readonly amount$ = combineLatest({
    bonusPercent: this.bonus$,
    amount: this.select(({ amount }) => amount),
    amountMode: this.amountMode$,
  }).pipe(
    map(({ bonusPercent, amount, amountMode }) =>
      this.service.getCraftAmount({
        amount,
        amountMode,
        bonusPercent,
      }),
    ),
  )

  private readonly stepIds$ = this.select(this.step$, selectStepIds)
  public readonly itemId$ = this.select(this.stepIds$, (it) => it.itemId)
  public readonly item$ = this.itemId$.pipe(switchMap((it) => this.service.fetchItem(it)))
  public readonly currency$ = this.select(this.step$, (it) => {
    if (it?.ingredient?.type === 'Currency') {
      return {
        label: `ui_${it.ingredient.id}`,
        quantity: it.ingredient.quantity,
      }
    }
    return null
  })
  public readonly categoryId$ = this.select(this.stepIds$, (it) => it.categoryId)
  public readonly category$ = this.categoryId$.pipe(switchMap((it) => this.service.fetchCategory(it)))
  public readonly options$ = this.select(this.stepIds$, (it) => it.optionIds)

  public constructor(
    private parent: CraftingCalculatorStore,
    private service: CraftingCalculatorService,
  ) {
    super({
      step: null,
      amount: 1,
      amountMode: 'net',
      showOptions: false,
    })
  }

  public setExpand(value: boolean) {
    this.parent.updateStep(
      this.get(({ step }) => step),
      (step) => {
        return {
          ...step,
          expand: value,
        }
      },
    )
  }

  public setShowoptions(value: boolean) {
    this.patchState({
      showOptions: !this.get(({ showOptions }) => showOptions),
    })
  }

  public selectOption(itemId: string) {
    this.parent.updateStep(
      this.get(({ step }) => step),
      (step) => {
        return {
          ...step,
          selection: itemId,
        }
      },
    )
  }
}

function selectStepIds(step: CraftingStep) {
  if (step?.options?.length) {
    return {
      itemId: step.selection,
      categoryId: step.ingredient.id,
      optionIds: step.options,
    }
  }
  return {
    itemId: step?.ingredient?.id || null,
    categoryId: null,
    optionIds: null,
  }
}
