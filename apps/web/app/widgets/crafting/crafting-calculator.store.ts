import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { CraftingRecipeData } from '@nw-data/generated'
import { EMPTY, map, switchMap, take, tap } from 'rxjs'
import { PreferencesService, StorageScopeNode } from '~/preferences'
import { CraftingCalculatorService } from './crafting-calculator.service'
import { AmountMode, CraftingStep } from './types'

export interface CraftingCalculatorState {
  recipeId: string
  amount: number
  amountMode: AmountMode
  tree: CraftingStep
}

@Injectable()
export class CraftingCalculatorStore extends ComponentStore<CraftingCalculatorState> {
  public readonly recipeId$ = this.select(({ recipeId }) => recipeId)
  public readonly recipe$ = this.select(this.service.fetchRecipe(this.recipeId$), (it) => it)
  public readonly amount$ = this.select(({ amount }) => amount)
  public readonly amountMode$ = this.select(({ amountMode }) => amountMode)

  public readonly tree$ = this.select(({ tree }) => tree)

  private cache: StorageScopeNode
  public constructor(private service: CraftingCalculatorService, pref: PreferencesService) {
    super({
      recipeId: null,
      amount: 1,
      amountMode: 'net',
      tree: null,
    })
    this.cache = pref.session.storageScope('crafting')
  }

  public load = this.effect<void>(() => {
    return this.recipe$.pipe(
      switchMap((recipe) => this.initializeState(recipe)),
      switchMap(() => this.watchAndCacheState())
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
          tree: tree,
        })
      })
  }

  public toggleQuantityMode = this.updater((state) => {
    return {
      ...state,
      amountMode: state.amountMode === 'gross' ? 'net' : 'gross',
    }
  })

  private watchAndCacheState() {
    return this.state$.pipe(
      tap((state) => {
        if (state.recipeId && this.cache) {
          this.cache.set(state.recipeId, state)
        }
      })
    )
  }

  private initializeState(recipe: CraftingRecipeData) {
    const cache = this.cache?.get<CraftingCalculatorState>(recipe?.RecipeID)
    if (cache) {
      this.patchState(cache)
      return EMPTY
    }
    return this.service.solveRecipe(recipe).pipe(
      map((step) => {
        this.patchState({
          tree: step,
        })
      })
    )
  }
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
