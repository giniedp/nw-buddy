import { inject, Injectable } from '@angular/core'
import {
  calculateBonusItemChance,
  getCraftingIngredients,
  getItemIdFromRecipe,
  getRecipeForItem,
} from '@nw-data/common'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs'
import { CharacterService, CharacterStore, injectNwData } from '~/data'
import { NW_TRADESKILLS_INFOS_MAP } from '~/nw/tradeskill'
import { eqCaseInsensitive, shareReplayRefCount } from '~/utils'
import { AmountDetail, AmountMode, CraftingStep, Ingredient } from './types'

@Injectable({ providedIn: 'root' })
export class CraftingCalculatorService {
  private db = injectNwData()
  private char = inject(CharacterStore)

  public fetchRecipe(recipeId: string) {
    return from(this.db.recipesById(recipeId))
  }

  public fetchItem(itemId: string) {
    return from(this.db.itemOrHousingItem(itemId))
  }

  public findItemsOrSelectedItems(steps: CraftingStep[]): Observable<Array<MasterItemDefinitions | HouseItems>> {
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

  public fetchGameEventForRecipe(recipe: CraftingRecipeData) {
    return from(this.db.gameEventsById(recipe?.GameEventID))
  }

  public getCraftBonus(step: CraftingStep): Observable<number> {
    if (!step || step.options?.length || !step.expand || step.ingredient.type !== 'Item') {
      return of(0)
    }
    return combineLatest({
      item: this.fetchItem(step.ingredient.id),
      recipes: this.db.recipesByItemIdMap(),
    }).pipe(
      switchMap(({ item, recipes }) => {
        const recipe = getRecipeForItem(item, recipes)
        if (!recipe) {
          return of(0)
        }
        return combineLatest({
          skillLevel: this.char.selectTradeSkillLevel(recipe.Tradeskill),
          skillSet: this.char.selectTradeSet(recipe.Tradeskill),
          customBonus: this.char.selectCustomYieldBonus(recipe.Tradeskill),
          flBonus: this.char.craftingFlBonus$,
          ingredients: this.findItemsOrSelectedItems(step.steps),
        }).pipe(
          map(({ skillLevel, skillSet, customBonus, flBonus, ingredients }) => {
            const flBonusChance = flBonus ? 0.1 : 0 // 10% first light bonus
            const gearScale = recipe.Tradeskill === 'Arcana' ? 0 : recipe.Tradeskill === 'Cooking' ? 0.04 : 0.02 // 2% per gear item
            const gearBonus = skillSet.length * gearScale

            return calculateBonusItemChance({
              item: item,
              ingredients: ingredients,
              recipe: recipe,
              skillLevel: skillLevel || 0,
              customChance: gearBonus + flBonusChance + (customBonus || 0) / 100,
              refiningChance: (NW_TRADESKILLS_INFOS_MAP.get(recipe.Tradeskill)?.CraftBonus || 0) / 100,
            })
          }),
        )
      }),
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
