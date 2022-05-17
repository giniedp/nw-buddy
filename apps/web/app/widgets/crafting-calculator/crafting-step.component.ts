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
} from '@angular/core'
import { Craftingcategories, Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { filter, ReplaySubject, Subject, switchMapTo, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { getItemRarity } from '~/core/nw/utils'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingCalculatorService, CraftingStep } from './crafting-calculator.service'

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
export class CraftingStepComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public step: CraftingStep

  public get steps() {
    return this.step?.steps
  }

  @Input()
  public quantity = 1

  @Input()
  public optimize = false

  @Input()
  public showPrice = false

  public get expand() {
    return this.step?.expand
  }

  public get stepQuantity() {
    return this.quantity * (this.step?.ingredient?.quantity || 0)
  }

  public bonus: number = 0

  public get bonusPercent() {
    return Math.round(this.bonus * 100)
  }

  public get bonusQuantity() {
    return Math.round(this.bonus * this.requiredQuantity)
  }

  public get requiredQuantity() {
    if (this.optimize) {
      return Math.ceil(this.stepQuantity / (1 + this.bonus))
    }
    return this.stepQuantity
  }

  public get outputQuantity() {
    if (this.optimize) {
      return this.stepQuantity
    }
    return Math.floor(this.stepQuantity * (1 + this.bonus))
  }

  @ViewChildren(forwardRef(() => CraftingStepComponent), {
    emitDistinctChangesOnly: true,
  })
  public children: QueryList<CraftingStepComponent>

  public itemId: string
  public item: ItemDefinitionMaster | Housingitems
  public category: Craftingcategories
  public options: ItemDefinitionMaster[]
  public showOptions = false

  @Output()
  public stateChange = new EventEmitter()

  public trackStepBy: TrackByFunction<any> = (i) => i
  private destroy$ = new Subject()
  private change$ = new ReplaySubject<CraftingStep>(1)

  public constructor(
    private calculator: CraftingCalculatorComponent,
    private nw: NwService,
    private service: CraftingCalculatorService,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    this.service.ready
      .pipe(switchMapTo(this.change$))
      .pipe(filter((it) => !!it))
      .pipe(takeUntil(this.destroy$))
      .subscribe((step) => {
        this.updateState(step)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(ch: SimpleChanges): void {
    this.change$.next(this.step)
    this.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public itemRarity(item: ItemDefinitionMaster | Housingitems) {
    return getItemRarity(item)
  }

  public async selectOption(itemId: string) {
    this.showOptions = false
    this.step.selection = itemId
    this.service.updateSteps(this.step, itemId)
    this.updateState(this.step)
    this.markForCheck()
    this.stateChange.emit()
  }

  public childChanged() {
    this.updateBonus()
    this.stateChange.emit()
  }

  private updateState(step: CraftingStep) {
    this.step = step
    if (step?.options?.length) {
      this.itemId = step.selection
      this.item = this.service.findItem(this.itemId)
      this.category = this.service.categoriesMap.get(step.ingredient.id)
      this.options = this.step.options.map((it) => this.service.itemsMap.get(it))
    } else if (step) {
      this.itemId = step.ingredient.id
      this.item = this.service.findItem(this.itemId)
      this.category = null
      this.options = null
    } else {
      this.itemId = null
      this.item = null
      this.category = null
      this.options = null
    }
    this.updateBonus()
  }

  public toggle() {
    this.step.expand = !this.expand
    this.updateBonus()
    this.stateChange.emit()
    this.markForCheck()
  }

  public toggleOptions() {
    this.showOptions = !this.showOptions
    this.markForCheck()
  }

  public updateBonus() {
    this.bonus = this.expand ? this.service.calculateBonus(this.step) : 0
    this.markForCheck()
  }

  private markForCheck() {
    this.cdRef.detectChanges()
    this.calculator.reportChange()
  }
}
