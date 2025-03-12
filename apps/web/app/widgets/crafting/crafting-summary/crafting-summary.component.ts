import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { TabsModule } from '~/ui/tabs'
import { combineLatestOrEmpty } from '~/utils'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingCalculatorStore } from '../crafting-calculator.store'
import { CraftingStep } from '../loader/load-recipe'
import { AmountMode } from '../types'
import { TabResourcesComponent } from './tab-resources.component'
import { TabStandingComponent } from './tab-standing.component'
import { TabTradeskillsComponent } from './tab-tradeskills.component'
import { CraftingStepWithAmount, SummaryRow } from './types'

export type CraftingSummaryTab = 'resources' | 'skills' | 'standing'

@Component({
  selector: 'nwb-crafting-summary',
  templateUrl: './crafting-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    TabResourcesComponent,
    TabTradeskillsComponent,
    TabStandingComponent,
    TabsModule,
  ],
  host: {
    class: 'block overflow-clip ',
  },
})
export class CraftingSummaryComponent {
  public total = input<number>(0)
  protected store = inject(CraftingCalculatorStore)
  protected service = inject(CraftingCalculatorService)
  protected tab = signal<CraftingSummaryTab>('resources')

  protected tree$ = combineLatest({
    amount: toObservable(this.store.amount),
    amountMode: toObservable(this.store.amountMode),
    step: toObservable(this.store.tree),
  }).pipe(switchMap((it) => this.treeWithAmounts(it)))

  protected leafs$ = this.tree$.pipe(map((it) => flattenTree(it, collectLeafs)))
  protected leafs = toSignal(this.leafs$)
  protected nodes$ = this.tree$.pipe(map((it) => flattenTree(it, collectNodes)))
  protected nodes = toSignal(this.nodes$)

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

type WalkFn = (step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) => void
function flattenTree(step: CraftingStepWithAmount, walk: WalkFn): SummaryRow[] {
  const result = new Map<string, SummaryRow>()
  walk(step, (node) => {
    const itemId = selectLeafId(node)
    if (!result.has(itemId)) {
      result.set(itemId, {
        recipeId: node.recipeId,
        itemId: itemId,
        amount: 0,
      })
    }
    result.get(itemId).amount += node.amount
  })
  return Array.from(result.values())
}

function collectNodes(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  walkTree(step, (node) => {
    if (!node.expand) {
      return false
    }
    fn(node)
    return true
  })
}

function collectLeafs(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  walkTree(step, (node) => {
    if (!node.expand || !node.steps?.length) {
      fn(node)
      return false
    }
    return true
  })
}

function walkTree(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => boolean) {
  if (fn(step)) {
    for (const subStep of step.steps || []) {
      walkTree(subStep, fn)
    }
  }
}

function selectLeafId(node: CraftingStepWithAmount) {
  switch (node.ingredient?.type) {
    case 'Item':
      return node.ingredient.id
    case 'Category_Only':
      return node.selection
    case 'Currency':
      return node.ingredient.id
    default:
      return null
  }
}
