import { inject, Injectable } from '@angular/core'
import { getCraftingYieldBonus } from '@nw-data/common'
import { from, map, Observable, of, switchMap } from 'rxjs'
import { CharacterStore, injectNwData } from '~/data'
import { CraftingBuffStore } from './crafting-bonus/crafting-buff.store'
import { CraftingStep } from './loader/load-recipe'
import { AmountDetail, AmountMode } from './types'

@Injectable({ providedIn: 'root' })
export class CraftingCalculatorService {
  private db = injectNwData()
  private char = inject(CharacterStore)
  private buffs = inject(CraftingBuffStore)

  public fetchItem(itemId: string) {
    return from(this.db.itemOrHousingItem(itemId))
  }

  public getCraftBonus(step: CraftingStep): Observable<number> {
    if (!step?.expand) {
      return of(0)
    }
    return of({
      recipeId: step?.recipeId,
      itemId: step?.ingredient?.id,
      ingredients: step?.steps,
    }).pipe(
      switchMap(async (step) => {
        const recipe = await this.db.recipesById(step.recipeId)
        const item = await this.db.itemOrHousingItem(step.itemId)
        const ingredients = await Promise.all(
          (step.ingredients || []).map((it) => {
            if (it.ingredient.type === 'Item') {
              return this.db.itemOrHousingItem(it.ingredient.id)
            }
            if (it.ingredient.type === 'Category_Only') {
              return this.db.itemOrHousingItem(it.selection)
            }
            return null
          }),
        ).then((items) => items.filter((it) => !!it))

        return {
          recipe,
          item,
          ingredients,
        }
      }),
      switchMap((data) => {
        return this.char
          .tradeskillLevelData(of(data.recipe?.Tradeskill))
          .pipe(map((skillData) => ({ ...data, skillData })))
      }),
      map(({ recipe, item, ingredients, skillData }) => {
        const bonus = this.buffs.getTradeskillBonusForYield(recipe?.Tradeskill)
        return getCraftingYieldBonus({
          recipe,
          item,
          ingredients,
          skill: skillData,
          buffs: bonus.buffs,
          fortBuffs: bonus.fort,
        })
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
