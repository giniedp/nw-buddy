import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { AmountMode, CraftingStep } from '../types'
import { CraftingStepWithAmount, SummaryRow } from './types'
import { TabResourcesComponent } from './tab-resources.component'
import { TabTradeskillsComponent } from './tab-tradeskills.component'

@Component({
  standalone: true,
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TabResourcesComponent, TabTradeskillsComponent],
})
export class CraftingSummaryComponent extends ComponentStore<{
  step: CraftingStep
  amount: number
  amountMode: 'net' | 'gross'
  tab: 'resources' | 'skills'
}> {
  @Input()
  public set step(value: CraftingStep) {
    this.patchState({ step: value })
  }

  @Input()
  public set amount(value: number) {
    this.patchState({ amount: value })
  }

  @Input()
  public set amountMode(value: AmountMode) {
    this.patchState({ amountMode: value })
  }

  protected vm$ = combineLatest({
    tab: this.select(({ tab }) => tab),
    isTabResources: this.select(({ tab }) => tab === 'resources'),
    isTabSkills: this.select(({ tab }) => tab === 'skills'),
    tree: this.state$.pipe(switchMap((data) => this.treeWithAmounts(data))),
  })

  public constructor(private service: CraftingCalculatorService) {
    super({
      step: null,
      amount: 1,
      amountMode: 'net',
      tab: 'resources',
    })
  }

  private treeWithAmounts(current: {
    amount: number
    amountMode: AmountMode
    step: CraftingStep
  }): Observable<CraftingStepWithAmount> {
    return this.service
      .getCraftBonus(current.step)
      .pipe(
        map((bonusPercent) =>
          this.service.getCraftAmount({
            amount: current.amount,
            amountMode: current.amountMode,
            bonusPercent,
          })
        )
      )
      .pipe(
        switchMap((amount) => {
          const children$ = current.step?.steps?.map((it) =>
            this.treeWithAmounts({
              amount: amount.net * it.ingredient.quantity,
              amountMode: current.amountMode,
              step: it,
            })
          )
          return (children$ ? combineLatest(children$) : of(null)).pipe(
            map((children) => {
              return {
                ...current.step,
                amount: amount.net,
                steps: children,
              }
            })
          )
        })
      )
  }

  // protected resolveItemsAndRecipes(rows: SummaryRow[]): Observable<SummaryRow[]> {
  //   if (!rows.length) {
  //     return of(rows)
  //   }
  //   return combineLatest(
  //     rows.map((row) => {
  //       const item$ = this.service.fetchItem(row.itemId)
  //       const recipe$ = row.recipeId
  //         ? this.service.fetchRecipe(row.recipeId)
  //         : item$.pipe(switchMap((item) => this.service.fetchRecipeForItem(item)))
  //       const event$ = recipe$.pipe(switchMap((recipe) => this.service.fetchGameEventForRecipe(recipe)))
  //       return combineLatest({
  //         item: item$,
  //         recipe: recipe$,
  //         event: event$,
  //       }).pipe(
  //         map(({ item, recipe }): SummaryRow => {
  //           return {
  //             ...row,
  //             item,
  //             recipe,
  //           }
  //         })
  //       )
  //     })
  //   )
  // }
}
