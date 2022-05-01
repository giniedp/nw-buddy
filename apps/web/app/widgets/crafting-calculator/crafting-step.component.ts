import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  TrackByFunction,
  SimpleChanges,
  QueryList,
  ViewChildren,
  forwardRef,
  Output,
  EventEmitter,
  AfterContentChecked,
  Inject,
  SkipSelf,
} from '@angular/core'
import { Crafting, Craftingcategories, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { Optional } from 'ag-grid-community'
import { combineLatest, of, ReplaySubject, Subject, take, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingPreferencesService } from './crafting-preferences.service'

export type IngredientType = 'Item' | 'Currency' | 'Category_Only'
export interface IngredientStep {
  ingredient: string
  quantity?: number
  type: IngredientType
}

@Component({
  selector: 'nwb-crafting-step',
  templateUrl: './crafting-step.component.html',
  styleUrls: ['./crafting-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingStepComponent implements OnInit, OnChanges, OnDestroy, AfterContentChecked {
  @Input()
  public recipe: Crafting

  @Input()
  public ingredient: string

  @Input()
  public quantity: number = 1

  @Input()
  public type: IngredientType = 'Item'

  @Input()
  public expand = false

  @Input()
  public collapsible = true

  @Input()
  public optimize = false

  @Output()
  public updated = new EventEmitter()

  public bonus: number = 0

  @Input()
  public showPrice = false

  public get isDowngrade() {
    return this.recipe?.CraftingCategory === 'ResourceDowngrade'
  }

  public get bonusPercent() {
    return Math.round(this.bonus * 100)
  }

  public get bonusQuantity() {
    if (!this.expand || !this.bonus) {
      return 0
    }
    return Math.round(this.bonus * this.requiredQuantity)
  }

  public get requiredQuantity() {
    if (!this.expand || !this.optimize || !this.bonus) {
      return this.quantity
    }
    return Math.ceil(this.quantity / (1 + this.bonus))
  }

  public get outputQuantity() {
    if (!this.expand || !this.optimize || !this.bonus) {
      return Math.floor(this.quantity * (1 + this.bonus))
    }
    return this.quantity
  }

  @ViewChildren(forwardRef(() => CraftingStepComponent), {
    emitDistinctChangesOnly: true,
  })
  public children: QueryList<CraftingStepComponent>

  public item: ItemDefinitionMaster | Housingitems
  public itemId: string
  public steps: Array<IngredientStep>
  public category: Craftingcategories
  public categoryOptions: ItemDefinitionMaster[]
  public categorySelection: string
  public showOptions = false

  public trackStepBy: TrackByFunction<any> = (i) => i
  private destroy$ = new Subject()
  private change$ = new ReplaySubject<IngredientStep & { recipe?: Crafting }>(1)
  private needsBonusUpdate = false

  public constructor(

    private calculator: CraftingCalculatorComponent,
    private pref: CraftingPreferencesService,
    private nw: NwService,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      items: this.nw.db.items,
      categories: this.nw.db.recipeCategoriesMap,
      changes: this.change$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ items, categories, changes }) => {
        this.item = null
        this.steps = null
        this.category = null
        this.categoryOptions = null
        this.categorySelection = null
        switch (this.type) {
          case 'Item': {
            this.selectItem(this.ingredient, changes.recipe)
            break
          }
          case 'Currency': {
            // ignored
            this.markForCheck()
            break
          }
          case 'Category_Only': {
            const reg = new RegExp(`\\b${this.ingredient}\\b`, 'i')
            this.category = categories.get(this.ingredient)
            this.categoryOptions = items.filter((it) => reg.test(it.IngredientCategories))
            this.categorySelection = this.preselection(this.ingredient, this.categoryOptions)
            this.selectItem(this.categorySelection)
            break
          }
        }
      })
  }

  public ngOnChanges(ch: SimpleChanges): void {
    if (this.getChange(ch, 'recipe')) {
      this.ingredient = this.nw.itemIdFromRecipe(this.recipe)
      this.type = 'Item'
      this.change$.next({
        recipe: this.recipe,
        ingredient: this.ingredient,
        type: this.type,
      })
    } else if (this.getChange(ch, 'ingredient') || this.getChange(ch, 'type')) {
      this.change$.next({
        ingredient: this.ingredient,
        type: this.type,
      })
    }
    this.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public ngAfterContentChecked(): void {
    if (this.needsBonusUpdate) {
      this.needsBonusUpdate = false
      this.updateBonus()
    }
  }

  public translate(key: string) {
    return this.nw.translate(key)
  }

  public itemRarity(item: ItemDefinitionMaster | Housingitems) {
    return this.nw.itemRarity(item)
  }

  public selectItem(itemId: string, recipe?: Crafting) {
    this.showOptions = false
    this.markForCheck()
    if (this.category) {
      this.saveCategoryPreference(this.category.CategoryID, itemId)
    }
    combineLatest({
      items: this.nw.db.itemsMap,
      housings: this.nw.db.housingItemsMap,
      recipes: this.nw.db.recipes,
      recipe: of(recipe),
    })
      .pipe(take(1))
      .subscribe(({ items, housings, recipes, recipe }) => {
        const item = items.get(itemId) || housings.get(itemId)
        recipe = recipe || (item && this.nw.recipeForItem(item, recipes))
        const steps = this.nw.recipeIngredients(recipe)
        this.recipe = recipe
        this.item = item
        this.itemId = this.nw.itemId(item)
        this.steps = steps
        this.markForCheck()
      })
  }

  public toggle() {
    this.expand = !this.expand
    this.makrBonusUpdate()
    this.markForCheck()
  }

  public toggleOptions() {
    this.showOptions = !this.showOptions
    this.markForCheck()
  }

  public makrBonusUpdate() {
    if (!this.needsBonusUpdate) {
      this.needsBonusUpdate = true
      this.cdRef.markForCheck()
    }
  }

  public updateBonus() {
    if (!this.item || !this.recipe || !this.expand || !this.children?.length) {
      this.bonus = 0
      this.markForCheck()
      return
    }
    const ingredients = this.children
      .toArray()
      .map((child) => child.item)
      .filter((it) => !!it)
    const skillLevel = this.nw.tradeskills.preferences.get(this.recipe.Tradeskill)?.level || 0
    const bonus = this.nw.calculateBonusItemChance({
      item: this.item,
      ingredients: ingredients,
      recipe: this.recipe,
      skill: skillLevel,
    })
    if (this.bonus !== bonus) {
      this.bonus = bonus
      this.markForCheck()
    }
  }

  private getChange(ch: SimpleChanges, key: keyof CraftingStepComponent) {
    return ch[key]
  }

  private preselection(categoryId: string, options: ItemDefinitionMaster[]) {
    options = options || []
    const fallback = options[0]?.ItemID
    const preference = categoryId && this.pref.categories.get(categoryId)
    const found = options.find((it) => it.ItemID === preference)
    return found ? preference : fallback
  }

  private saveCategoryPreference(categoryId: string, value: string) {
    this.pref.categories.set(categoryId, value)
  }

  private markForCheck() {
    this.updated.emit()
    this.cdRef.detectChanges()
    this.calculator.reportChange()
  }
}
