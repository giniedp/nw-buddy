import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core'
import { Crafting } from '@nw-data/types'
import { debounceTime, defer, distinctUntilChanged, ReplaySubject, Subject, switchMap, switchMapTo, takeUntil, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { getItemIdFromRecipe } from '~/core/nw/utils'
import { CraftingCalculatorService, CraftingStep, RecipeState } from './crafting-calculator.service'
import { CraftingPreferencesService } from './crafting-preferences.service'
import type { CraftingStepComponent } from './crafting-step.component'

@Component({
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  styleUrls: ['./crafting-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hidden]': '!recipe'
  }
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

  public stepChange = defer(() => this.stepChange$)

  private destroy$ = new Subject()
  private stepChange$ = new Subject()
  private recipeId$ = new ReplaySubject<string>(1)

  public constructor(private cdRef: ChangeDetectorRef, private nw: NwService, private service: CraftingCalculatorService) {}

  public ngOnInit(): void {

    this.service.ready.pipe(switchMapTo(this.recipeId$))
      .pipe(distinctUntilChanged())
      .pipe(tap((id) => {
        this.step = this.loadState(id)
        this.cdRef.markForCheck()
      }))
      .pipe(switchMap(() => this.stepChange$))
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
    this.stepChange$.next(null)
  }

  public toggleOptimize() {
    this.optimize = !this.optimize
    this.cdRef.markForCheck()
  }

  private loadState(id: string) {
    return this.service.getFromCache(id) || this.service.solve({
      ingredient: {
        id: getItemIdFromRecipe(this.recipe),
        quantity: 1,
        type: 'Item'
      },
      expand: true,
    })
  }

  private saveState(step: CraftingStep) {
    this.service.putToCache(step.ingredient.id, step)
  }
}
