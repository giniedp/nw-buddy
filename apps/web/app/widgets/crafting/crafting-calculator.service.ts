import { Injectable } from '@angular/core'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwDbService } from '~/nw'
import { calculateBonusItemChance, getIngretientsFromRecipe, getItemIdFromRecipe, getRecipeForItem } from '~/nw/utils'
import { eqCaseInsensitive, shareReplayRefCount } from '~/utils'
import { AmountDetail, AmountMode, CraftingStep, Ingredient } from './types'

@Injectable({ providedIn: 'root' })
export class CraftingCalculatorService {
  public constructor(private db: NwDbService, private char: CharacterStore) {
    //
  }

  public solveRecipe(recipe: Crafting) {
    if (!recipe) {
      return of(null)
    }
    return this.solveTree({
      recipeId: recipe.RecipeID,
      expand: true,
      ingredient: {
        id: getItemIdFromRecipe(recipe),
        quantity: 1,
        type: 'Item',
      },
    })
  }

  public solveTree(step: CraftingStep): Observable<CraftingStep> {
    if (step.ingredient.type === 'Item') {
      return this.solveSteps(step)
    }
    if (step.ingredient.type === 'Category_Only') {
      return this.findItemIdsForCraftingCategory(step.ingredient.id)
        .pipe<CraftingStep>(
          map((options) => ({
            ...step,
            options: options,
          }))
        )
        .pipe<CraftingStep>(
          map((step) => ({
            ...step,
            selection: this.clampSelection(step),
          }))
        )
        .pipe<CraftingStep>(
          switchMap((step) => {
            return this.solveSteps(step)
          })
        )
    }
    return of({
      ingredient: null,
    })
  }

  public solveSteps(step: CraftingStep): Observable<CraftingStep> {
    const source$ = this.fetchIngredientsForStep(step).pipe(shareReplayRefCount(1))
    const recipeId$ = source$.pipe(map((it) => it.recipeId))
    const ingredients$ = source$.pipe(map((it) => it.ingredients))
    const steps$ = ingredients$.pipe(
      switchMap((ingredients) => {
        if (!ingredients?.length) {
          return of(null)
        }
        return combineLatest(
          ingredients.map((ingredient) => {
            const state = step.steps?.find((it) => it.ingredient.id === ingredient.id) || {}
            return this.solveTree({
              ...state,
              recipeId: null,
              ingredient: ingredient,
            })
          })
        )
      })
    )

    return combineLatest({
      recipeId: recipeId$,
      steps: steps$,
    }).pipe(
      map(({ recipeId, steps }) => {
        return {
          ...step,
          steps: steps,
          recipeId: recipeId,
        }
      })
    )
  }

  public findItemIdsForCraftingCategory(categoryId: string) {
    return this.db
      .itemsByIngredientCategory(categoryId)
      .pipe(map((set) => (set ? Array.from(set?.values()).map((it) => it.ItemID) : null)))
  }

  public fetchRecipe(recipeId: string | Observable<string>) {
    return this.db.recipe(recipeId)
  }

  public fetchItem(itemId: string | Observable<string>) {
    return this.db.itemOrHousingItem(itemId)
  }

  public fetchCategory(categoryId: string | Observable<string>) {
    return this.db.recipeCategory(categoryId)
  }

  public fetchRecipeForItem(item: ItemDefinitionMaster | Housingitems) {
    return this.db.recipes.pipe(map((recipes) => getRecipeForItem(item, recipes)))
  }

  public fetchIngredientsForStep(step: CraftingStep) {
    if (step.recipeId) {
      return this.fetchIngredientsForRecipe(step.recipeId)
    }
    if (step.options) {
      return this.fetchIngredientsForItem(step.selection)
    }
    return this.fetchIngredientsForItem(step.ingredient.id)
  }

  public fetchIngredientsForItem(
    itemId: string
  ): Observable<{ itemId: string; recipeId: string; ingredients: Ingredient[] }> {
    return this.fetchItem(itemId).pipe(
      switchMap((item) => this.fetchRecipeForItem(item)),
      map((recipe) => {
        return {
          itemId,
          recipeId: recipe?.RecipeID,
          ingredients: getIngretientsFromRecipe(recipe).map((it) => ({
            id: it.ingredient,
            type: (it.type as any) || 'Item', // TODO: data needs to be checked for consistency
            quantity: it.quantity,
          })),
        }
      })
    )
  }

  public fetchIngredientsForRecipe(recipeId: string): Observable<{ recipeId: string; ingredients: Ingredient[] }> {
    return this.db.recipe(recipeId).pipe(
      map((recipe) => {
        return {
          recipeId: recipeId,
          ingredients: getIngretientsFromRecipe(recipe).map(
            (it): Ingredient => ({
              id: it.ingredient,
              type: (it.type as any) || 'Item', // TODO: data needs to be checked for consistency
              quantity: it.quantity,
            })
          ),
        }
      })
    )
  }

  public findItemsOrSelectedItems(steps: CraftingStep[]): Observable<Array<ItemDefinitionMaster | Housingitems>> {
    const ids = steps
      .map((it) => {
        switch (it.ingredient?.type) {
          case 'Item':
            return it.ingredient.id
          case 'Category_Only':
            return it.selection
          default:
            return null
        }
      })
      .filter((it) => !!it)

    if (!ids.length) {
      return of([])
    }
    return combineLatest(ids.map((it) => this.fetchItem(it)))
  }

  public fetchGameEventForRecipe(recipe: Crafting) {
    return this.db.gameEvent(recipe?.GameEventID)
  }

  private clampSelection({ options, selection }: CraftingStep) {
    return options.find((it) => eqCaseInsensitive(it, selection)) || options[0]
  }

  public getCraftBonus(step: CraftingStep): Observable<number> {
    if (!step || step.options?.length || !step.expand || step.ingredient.type !== 'Item') {
      return of(0)
    }
    return combineLatest({
      item: this.fetchItem(step.ingredient.id),
      recipes: this.db.recipes,
    }).pipe(
      switchMap(({ item, recipes }) => {
        const recipe = getRecipeForItem(item, recipes)
        if (!recipe) {
          return of(0)
        }
        return combineLatest({
          skillLevel: this.char.selectTradeSkillLevel(recipe.Tradeskill),
          skillSet: this.char.selectTradeSet(recipe.Tradeskill),
          flBonus: this.char.craftingFlBonus$,
          ingredients: this.findItemsOrSelectedItems(step.steps),
        }).pipe(
          map(({ skillLevel, skillSet, flBonus, ingredients }) => {
            const flBonusChance = flBonus ? 0.1 : 0 // 10% first light bonus
            const gearScale = recipe.Tradeskill === 'Cooking' ? 0.04 : 0.02 // 2% per gear item
            const gearBonus = skillSet.length * gearScale
            return calculateBonusItemChance({
              item: item,
              ingredients: ingredients,
              recipe: recipe,
              skill: skillLevel || 0,
              customChance: gearBonus + flBonusChance,
            })
          })
        )
      })
    )
  }

  public getCraftAmount({
    amount,
    amountMode,
    bonusPercent,
  }: {
    amount: number
    bonusPercent: number
    amountMode: AmountMode
  }): AmountDetail {
    const isGross = amountMode === 'gross'
    const net = isGross ? Math.ceil(amount / (1 + bonusPercent)) : amount
    const gross = isGross ? amount : Math.floor(amount * (1 + bonusPercent))
    const bonus = Math.round(bonusPercent * net)
    return {
      net: net,
      gross: gross,
      bonus: bonus,
      bonusPercent,
    }
  }
}