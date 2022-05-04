import { Injectable, OnDestroy } from '@angular/core'
import { Crafting, Craftingcategories, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, defer, ReplaySubject, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'

export interface RecipeState {
  quantity: number
  optimize: boolean
  tree: CraftingStep
}

export interface CraftingStep {
  ingredient: Ingredient
  selection?: string
  options?: string[]
  expand?: boolean
  steps?: CraftingStep[]
}

export type IngredientType = 'Item' | 'Currency' | 'Category_Only'
export interface Ingredient {
  id: string
  type: IngredientType
  quantity: number
}

@Injectable({ providedIn: 'root' })
export class CraftingCalculatorService implements OnDestroy {
  public ready = defer(() => this.ready$)

  public itemsMap: Map<string, ItemDefinitionMaster>
  public housingMap: Map<string, Housingitems>
  public categoriesMap: Map<string, Craftingcategories>

  private ready$ = new ReplaySubject()
  private destroy$ = new Subject()
  private items: ItemDefinitionMaster[]
  private housingItems: Housingitems[]
  private recipes: Crafting[]
  private recipesMap: Map<string, Crafting>
  private cache = new Map<string, CraftingStep>()

  public constructor(private nw: NwService) {
    combineLatest({
      items: nw.db.items,
      itemsMap: nw.db.itemsMap,
      housingItems: nw.db.housingItems,
      housingMap: nw.db.housingItemsMap,
      recipes: nw.db.recipes,
      recipesMap: nw.db.recipesMap,
      categoriesMap: nw.db.recipeCategoriesMap,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ items, itemsMap, housingItems, housingMap, recipes, recipesMap, categoriesMap }) => {
        this.items = items
        this.itemsMap = itemsMap
        this.housingItems = housingItems
        this.housingMap = housingMap
        this.recipes = recipes
        this.recipesMap = recipesMap
        this.categoriesMap = categoriesMap
        this.ready$.next(null)
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public findItemIdsInCategory(categoryId: string) {
    const reg = new RegExp(`\\b${categoryId}\\b`, 'i')
    return this.items.filter((it) => reg.test(it.IngredientCategories)).map((it) => it.ItemID)
  }

  public findItem(itemId: string) {
    return this.itemsMap.get(itemId) || this.housingMap.get(itemId)
  }

  public findRecipeForItem(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.recipeForItem(item, this.recipes)
  }

  public findRecipeIngrediendsForItem(itemId: string) {
    const item = this.findItem(itemId)
    const recipe = this.findRecipeForItem(item)
    return (this.nw.recipeIngredients(recipe) || []).map(
      (it): Ingredient => ({
        id: it.ingredient,
        type: it.type,
        quantity: it.quantity,
      })
    )
  }

  public findItemsOrSelectedItems(steps: CraftingStep[]) {
    return steps
      .map((it) => {
        if (it.ingredient.type === 'Item') {
          return it.ingredient.id
        }
        if (it.ingredient.type === 'Category_Only') {
          return it.selection
        }
        return null
      })
      .filter((it) => !!it)
      .map((it) => this.findItem(it))
      .filter((it) => !!it)
  }

  public solve(step: CraftingStep): CraftingStep {
    const ingredient = step.ingredient
    if (ingredient.type === 'Item') {
      return this.updateSteps(
        {
          ingredient: ingredient,
          expand: step.expand,
        },
        ingredient.id
      )
    }
    if (ingredient.type === 'Category_Only') {
      const options = this.findItemIdsInCategory(ingredient.id)
      const selection = clampSelection(options, step.selection)
      return this.updateSteps(
        {
          ingredient: ingredient,
          expand: step.expand,
          options,
          selection,
        },
        selection
      )
    }
    return {
      ingredient: null,
    }
  }

  public updateSteps(step: CraftingStep, selection: string): CraftingStep {
    step.steps = this.findRecipeIngrediendsForItem(selection).map((ingredient) => {
      const state = step.steps?.find((it) => it.ingredient.id === ingredient.id) || {}
      return this.solve({
        ...state,
        ingredient: ingredient,
      })
    })
    return step
  }

  public calculateBonus(step: CraftingStep) {
    if (step.options?.length || !step.expand || step.ingredient.type !== 'Item') {
      return 0
    }
    const item = this.findItem(step.ingredient.id)
    const recipe = this.nw.recipeForItem(item, this.recipes)
    if (!recipe) {
      return 0
    }

    return this.nw.calculateBonusItemChance({
      item: item,
      ingredients: this.findItemsOrSelectedItems(step.steps),
      recipe: recipe,
      skill: this.nw.tradeskills.preferences.get(recipe.Tradeskill)?.level || 0,
    })
  }

  public getFromCache(id: string): CraftingStep {
    const result = this.cache.get(id)
    if (!result) {
      return null
    }
    return JSON.parse(JSON.stringify(result))
  }

  public putToCache(id: string, step: CraftingStep) {
    if (!step) {
      this.cache.delete(id)
    } else {
      this.cache.set(id, JSON.parse(JSON.stringify(step)))
    }
  }
}

function clampSelection(options: string[], selection: string) {
  return options.find((it) => it === selection) || options[0]
}
