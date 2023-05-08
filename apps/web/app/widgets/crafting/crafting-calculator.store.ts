import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { map, switchMap, take } from 'rxjs'
import { CraftingCalculatorService } from './crafting-calculator.service'
import { AmountMode, CraftingStep } from './types'
import { tapDebug } from '~/utils'

export interface CraftingCalculatorState {
  recipeId: string
  amount: number
  amountMode: AmountMode
  tree: CraftingStep
}

@Injectable()
export class CraftingCalculatorStore extends ComponentStore<CraftingCalculatorState> {
  public readonly recipeId$ = this.select(({ recipeId }) => recipeId)
  public readonly recipe$ = this.select(this.service.fetchRecipe(this.recipeId$), (it) => it).pipe(tapDebug('resipe'))
  public readonly amount$ = this.select(({ amount }) => amount)
  public readonly amountMode$ = this.select(({ amountMode }) => amountMode)

  public readonly tree$ = this.select(({ tree }) => tree)

  public constructor(private service: CraftingCalculatorService) {
    super({
      recipeId: null,
      amount: 1,
      amountMode: 'net',
      tree: null,
    })
  }

  public load = this.effect<void>(() => {
    return this.recipe$.pipe(switchMap((recipe) => this.service.solveRecipe(recipe))).pipe(
      map((step) => {
        this.patchState({
          tree: step,
        })
      })
    )
  })

  public updateStep(step: CraftingStep, modify: (step: CraftingStep) => CraftingStep) {
    this.updateTree((current) => (current === step ? modify(current) : current))
  }

  public updateTree(modify: (step: CraftingStep) => CraftingStep) {
    this.tree$
      .pipe(take(1))
      .pipe(map((tree) => modifyTree(tree, (step) => ({ ...modify(step) }))))
      .pipe(switchMap((tree) => this.service.solveTree(tree)))
      .subscribe((tree) => {
        this.patchState({
          tree: tree
        })
      })
  }

  public toggleQuantityMode = this.updater((state) => {
    return {
      ...state,
      amountMode: state.amountMode === 'gross' ? 'net' : 'gross',
    }
  })
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
