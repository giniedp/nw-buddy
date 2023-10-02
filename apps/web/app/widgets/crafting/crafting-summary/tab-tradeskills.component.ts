import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { DestroyService, shareReplayRefCount } from '~/utils'

import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { calculateCraftingReward, getItemId } from '@nw-data/common'
import { Crafting, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { groupBy, sumBy } from 'lodash'
import { combineLatest, map, switchMap } from 'rxjs'
import { NW_TRADESKILLS_INFOS_MAP } from '~/nw/tradeskill'
import { TooltipModule } from '~/ui/tooltip'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { CraftingCalculatorService } from '../crafting-calculator.service'
import { CraftingStepWithAmount, SkillRow, SummaryRow } from './types'

@Component({
  standalone: true,
  selector: 'tab-tradeskills',
  templateUrl: './tab-tradeskills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TradeskillsModule, TooltipModule],
  providers: [DestroyService],
  host: {
    class: 'block',
  },
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
      item: this.service.fetchItem(row.itemId),
    }).pipe(
      map(({ recipe, event, item }) => {
        return {
          item: item,
          recipe: recipe,
          count: row.amount,
          xp: event ? calculateCraftingReward(recipe, event) : 0,
        }
      })
    )
  }
}

function collectExpandedNodes(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  if (step?.expand) {
    fn(step)
    step.steps?.forEach((it) => collectExpandedNodes(it, fn))
  }
}

function aggregate(step: CraftingStepWithAmount): SummaryRow[] {
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

function aggregateSkills(
  rows: Array<{ recipe: Crafting; item: ItemDefinitionMaster | Housingitems; xp: number; count: number }>
) {
  const result = new Map<string, SkillRow>()

  const groups = groupBy(rows, (it) => it.recipe?.Tradeskill)
  for (const [skillid, data] of Object.entries(groups)) {
    const skill = NW_TRADESKILLS_INFOS_MAP.get(skillid)
    if (!skill) {
      continue
    }
    if (!result.has(skill.ID)) {
      result.set(skill.ID, {
        id: skill.ID,
        icon: skill.Icon,
        name: skill.ID,
        xp: 0,
        steps: [],
      })
    }

    const skillRow = result.get(skill.ID)

    const recipeGroups = groupBy(data, (it) => it.recipe?.RecipeID)
    for (const [recipeId, steps] of Object.entries(recipeGroups)) {
      skillRow.xp += sumBy(steps, (it) => it.count * it.xp)
      skillRow.steps.push({
        count: sumBy(steps, (it) => it.count),
        xp: steps[0].xp,
        recipe: steps[0].recipe,
        item: steps[0].item,
        itemId: getItemId(steps[0].item),
        icon: steps[0].item?.IconPath,
        label: steps[0].item?.Name,
      })
    }
  }
  return Array.from(result.values())
}
