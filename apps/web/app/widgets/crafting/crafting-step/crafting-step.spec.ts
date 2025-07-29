import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { getCraftingYieldBonus, getCraftingIngredients } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { injectNwData } from '~/data'
import { BONUS_SAMPLES } from './bonus-samples'

describe('CraftingStep', () => {
  let db: NwData = null
  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })
    TestBed.runInInjectionContext(() => {
      db = injectNwData()
    })
  })

  describe('Bonuses', () => {
    for (const spec of BONUS_SAMPLES) {
      it(`${spec.recipe} => ${spec.expect}`, async () => {
        const data = await fetchRecipe(db, spec.recipe, spec.selection)
        // emulates max skill, easier to compare to maxed out character
        const skill = await db.tradeskillRankDataByTradeskillAndLevel(data.recipe.Tradeskill, 250)
        const bonus = getCraftingYieldBonus({
          ...data,
          skill: skill,
          buffs: 0,
          fortBuffs: 0,
        })
        expect(bonus).toBeCloseTo(spec.expect, 2)
      })
    }
  })
})

async function fetchRecipe(db: NwData, recipeId: string, selection: Record<string, string>) {
  const recipe = await db.recipesById(recipeId)
  const item = await db.itemOrHousingItem(recipe.ItemID)

  const ingredients = await Promise.all(
    (getCraftingIngredients(recipe) || []).map((it) => {
      if (it.type === 'Item') {
        return db.itemOrHousingItem(it.ingredient)
      }
      if (it.type === 'Category_Only') {
        if (!selection[it.ingredient]) {
          throw new Error(`Missing selection for ${it.ingredient}`)
        }
        return db.itemOrHousingItem(selection[it.ingredient])
      }
      return null
    }),
  ).then((items) => items.filter((it) => !!it))
  return {
    recipe,
    item,
    ingredients,
  }
}
