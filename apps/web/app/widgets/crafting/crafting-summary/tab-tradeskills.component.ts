import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { DestroyService, shareReplayRefCount } from '~/utils'

import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { NW_TRADESKILLS_INFOS_MAP } from '~/nw/tradeskill'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { CraftingStepWithAmount, SkillRow, SummaryRow } from './types'
import { combineLatest, map, of, shareReplay, switchMap } from 'rxjs'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { Crafting, GameEvent } from '@nw-data/types'
import { calculateCraftingReward } from '~/nw/utils'

@Component({
  standalone: true,
  selector: 'tab-tradeskills',
  templateUrl: './tab-tradeskills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TradeskillsModule],
  providers: [DestroyService],
})
export class TabTradeskillsComponent extends ComponentStore<{
  tree: CraftingStepWithAmount
}> {
  @Input()
  public set tree(value: CraftingStepWithAmount) {
    this.patchState({ tree: value })
  }

  protected readonly summary$ = this.select(({ tree }) => aggregate(tree))
  protected readonly rows$ = this.select(this.table(), aggregateSkills)

  protected trackByIndex = (i: number) => i

  public constructor(private service: CraftingCalculatorService) {
    super({
      tree: null,
    })
  }

  private table() {
    return this.summary$.pipe(switchMap((rows) => combineLatest(rows.map((row) => this.resolveRow(row)))))
  }

  protected resolveRow(row: SummaryRow) {
    const recipe$ = this.service.fetchRecipe(row.recipeId).pipe(shareReplayRefCount(1))
    const event$ = recipe$.pipe(switchMap((it) => this.service.fetchGameEventForRecipe(it)))
    return combineLatest({
      recipe: recipe$,
      event: event$,
      amount: of(row.amount),
    })
  }
}

function collectExpandedNodes(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  if (step?.expand) {
    fn(step)
    step.steps?.forEach((it) => collectExpandedNodes(it, fn))
  }
}

function aggregate(step: CraftingStepWithAmount) {
  const result = new Map<string, SummaryRow>()
  collectExpandedNodes(step, (node) => {
    const itemId = node.ingredient?.type === 'Item' ? node.ingredient.id : node.selection
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

function aggregateSkills(rows: Array<{ recipe: Crafting; event: GameEvent; amount: number }>) {
  const result = new Map<string, SkillRow>()
  for (const row of rows) {
    const skill = NW_TRADESKILLS_INFOS_MAP.get(row.recipe?.Tradeskill)
    if (!skill) {
      continue
    }
    if (!result.has(skill.ID)) {
      result.set(skill.ID, {
        id: skill.ID,
        icon: skill.Icon,
        name: skill.ID,
        xp: 0,
      })
    }

    result.get(skill.ID).xp += calculateCraftingReward(row.recipe, row.event) * row.amount || 0
  }
  return Array.from(result.values())
}
