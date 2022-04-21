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
} from '@angular/core'
import { Crafting, Craftingcategories, ItemDefinitionMaster } from '@nw-data/types'
import { combineLatest, ReplaySubject, Subject, take, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { CraftingCalculatorComponent } from './crafting-calculator.component'

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

  public get bonusPercent() {
    return Math.round(this.bonus * 100)
  }

  public get bonusQuantity() {
    if (!this.expand || !this.bonus) {
      return 0
    }
    return Math.round(this.bonus * this.actualQuantity)
  }

  public get actualQuantity() {
    if (!this.expand || !this.optimize || !this.bonus) {
      return this.quantity
    }
    return Math.ceil(this.quantity / (1 + this.bonus))
  }

  @ViewChildren(forwardRef(() => CraftingStepComponent), {
    emitDistinctChangesOnly: true,
  })
  public children: QueryList<CraftingStepComponent>

  public recipe: Crafting
  public item: ItemDefinitionMaster
  public steps: Array<IngredientStep>
  public category: Craftingcategories
  public categoryOptions: ItemDefinitionMaster[]
  public categorySelection: string
  public showOptions: boolean

  public trackStepBy: TrackByFunction<any> = (i) => i
  private destroy$ = new Subject()
  private change$ = new ReplaySubject<IngredientStep>(1)
  private needsBonusUpdate = false

  public constructor(private parent: CraftingCalculatorComponent, private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      items: this.nw.db.items,
      categories: this.nw.db.recipeCategoriesMap,
      changes: this.change$,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ items, categories }) => {
        this.item = null
        this.steps = null
        this.category = null
        this.categoryOptions = null
        this.categorySelection = null
        switch (this.type) {
          case 'Item': {
            this.selectItem(this.ingredient)
            break
          }
          case 'Currency': {
            // TODO:
            this.markForCheck()
            break
          }
          case 'Category_Only': {
            const reg = new RegExp(`\\b${this.ingredient}\\b`, 'i')
            this.category = categories.get(this.ingredient)
            this.categoryOptions = items.filter((it) => reg.test(it.IngredientCategories))
            this.categorySelection = this.categoryOptions?.[0]?.ItemID
            this.selectItem(this.categorySelection)
            break
          }
        }
      })
  }

  public ngOnChanges(ch: SimpleChanges): void {
    if (this.getChange(ch, 'ingredient') || this.getChange(ch, 'type')) {
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

  public itemRarity(item: ItemDefinitionMaster) {
    return this.nw.itemRarity(item)
  }

  public selectItem(itemId: string) {
    this.showOptions = false
    this.markForCheck()
    combineLatest({
      items: this.nw.db.items,
      recipes: this.nw.db.recipes,
    })
      .pipe(take(1))
      .subscribe(({ items, recipes }) => {
        const item = items.find((it) => it.ItemID === itemId)
        const recipe = item && this.nw.findRecipeForItem(item, recipes)
        const steps = Object.keys(recipe || {})
          .filter((it) => it.match(/^Ingredient\d+$/))
          .map((_, i) => {
            return {
              ingredient: recipe[`Ingredient${i + 1}`],
              quantity: recipe[`Qty${i + 1}`],
              type: recipe[`Type${i + 1}`],
            }
          })
        this.recipe = recipe
        this.item = item
        this.steps = steps
        this.markForCheck()
      })
  }

  public toggle() {
    this.expand = !this.expand
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

    const bonus = this.nw.calculateBonusItemChance({
      item: this.item,
      ingredients: this.children.toArray().map((child) => child.item).filter((it) => !!it),
      recipe: this.recipe
    })
    console.log(bonus)
    if (this.bonus !== bonus) {
      this.bonus = bonus
      this.markForCheck()
    }
  }

  private getChange(ch: SimpleChanges, key: keyof CraftingStepComponent) {
    return ch[key]
  }

  private markForCheck() {
    this.updated.emit()
    this.cdRef.detectChanges()
    this.parent.reportChange()
  }
}
