import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { TabsModule } from '~/ui/tabs'
import { combineLatestOrEmpty } from '~/utils'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { AmountMode, CraftingStep } from '../types'
import { TabResourcesComponent } from './tab-resources.component'
import { TabTradeskillsComponent } from './tab-tradeskills.component'
import { CraftingStepWithAmount } from './types'

export type CraftingSummaryTab = 'resources' | 'skills' | 'standing'

@Component({
  standalone: true,
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TabResourcesComponent, TabTradeskillsComponent, TabsModule],
})
export class CraftingSummaryComponent {
  protected store = inject(CraftingCalculatorStore)
  protected service = inject(CraftingCalculatorService)
  protected tab = signal<CraftingSummaryTab>('resources')

  protected tree$ = combineLatest({
    amount: toObservable(this.store.amount),
    amountMode: toObservable(this.store.amountMode),
    step: toObservable(this.store.tree),
  }).pipe(switchMap((it) => this.treeWithAmounts(it)))

  private treeWithAmounts(current: {
    amount: number
    amountMode: AmountMode
    step: CraftingStep
  }): Observable<CraftingStepWithAmount> {
    return this.service.getCraftBonus(current.step).pipe(
      map((bonusPercent) => {
        return this.service.getCraftAmount({
          amount: current.amount,
          amountMode: current.amountMode,
          bonusPercent,
        })
      }),

      switchMap((amount) => {
        const children$ = current.step?.steps?.map((it) =>
          this.treeWithAmounts({
            amount: amount.net * (it.ingredient?.quantity || 1),
            amountMode: current.amountMode,
            step: it,
          }),
        )
        return combineLatestOrEmpty(children$).pipe(
          map((children) => {
            return {
              ...current.step,
              amount: amount.net,
              steps: children,
            }
          }),
        )
      }),
    )
  }
}
