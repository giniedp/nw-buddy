import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Crafting } from '@nw-data/types'
import { debounceTime, distinctUntilChanged, ReplaySubject, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { NwModule } from '~/nw'
import { getItemIdFromRecipe } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgDollarSign, svgGears, svgPercent } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { PriceImporterModule } from '../price-importer/price-importer.module'
import { CraftingCalculatorService, CraftingStep } from './crafting-calculator.service'
import { CraftingChanceMenuComponent } from './crafting-chance-menu.component'
import { CraftingStepComponent } from './crafting-step.component'
import { CraftingSummaryComponent } from './crafting-summary.component'

@Component({
  standalone: true,
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  styleUrls: ['./crafting-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    FormsModule,
    PriceImporterModule,
    CraftingSummaryComponent,
    CraftingStepComponent,
    TooltipModule,
    LayoutModule,
    CraftingChanceMenuComponent,
  ],
  providers: [CraftingCalculatorService],
  host: {
    '[class.hidden]': '!recipe',
  },
})
export class CraftingCalculatorComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public quantity: number = 1

  @Input()
  public optimize: boolean = false

  @Input()
  public recipe: Crafting

  public step: CraftingStep

  @ViewChild('rootStep')
  public rootStep: CraftingStepComponent

  @Input()
  public enableSummary: boolean = true

  protected iconImporter = svgDollarSign
  protected iconMode = svgPercent
  protected iconOptions = svgGears
  protected isToolOpen = false
  private destroy$ = new Subject()
  private recipeId$ = new ReplaySubject<string>(1)

  public constructor(private cdRef: ChangeDetectorRef, private service: CraftingCalculatorService) {
    //
  }

  public ngOnInit(): void {
    this.service.ready
      .pipe(switchMap(() => this.recipeId$))
      .pipe(distinctUntilChanged())
      .pipe(
        tap((id) => {
          this.step = this.loadStep(id)
          this.cdRef.markForCheck()
        })
      )
      .pipe(switchMap(() => this.service.change))
      .pipe(debounceTime(0))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveState(this.step)
      })
  }

  public ngOnChanges(): void {
    this.recipeId$.next(this.recipe?.RecipeID)
    this.cdRef.markForCheck()
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public reportChange() {
    this.service.reportChange()
  }

  public forceRefresh() {
    this.service.refresh()
  }

  public toggleOptimize() {
    this.optimize = !this.optimize
    this.cdRef.markForCheck()
  }

  private loadStep(recipeId: string): CraftingStep {
    const ingredientId = getItemIdFromRecipe(this.recipe)
    const key = this.buildStateKey(ingredientId, recipeId)
    return (
      this.service.getFromCache(key) ||
      this.service.solve({
        recipeId: recipeId,
        ingredient: {
          id: ingredientId,
          quantity: 1,
          type: 'Item',
        },
        expand: true,
      })
    )
  }

  private saveState(step: CraftingStep) {
    const key = this.buildStateKey(step.ingredient.id, step.recipeId)
    this.service.putToCache(key, step)
  }
  private buildStateKey(ingredientId: string, recipeId: string) {
    return [ingredientId, recipeId].filter((it) => !!it).join('-')
  }
}
