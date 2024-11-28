import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'

import { RouterModule } from '@angular/router'
import { NwTradeSkillInfo, getCraftingSkillXP, getCraftingStandingXP } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { groupBy, sumBy } from 'lodash'
import { injectNwData } from '~/data'
import { TooltipModule } from '~/ui/tooltip'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { CraftingStepWithAmount } from './types'

@Component({
  standalone: true,
  selector: 'tab-tradeskills',
  templateUrl: './tab-tradeskills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TradeskillsModule, TooltipModule],
  providers: [],
  host: {
    class: 'block',
  },
})
export class TabTradeskillsComponent {
  private db = injectNwData()
  public tree = input<CraftingStepWithAmount>(null)

  protected resource = apiResource({
    request: this.tree,
    loader: async ({ request }) => {
      const rows = await Promise.all(
        flattenTree(request).map(async (row) => {
          row.data = await resolveRowData(this.db, row)
          return row
        }),
      )
      return {
        skillsXp: aggregateStandingXP(rows),
        skills: aggregateSkills(rows),
      }
    },
  })
  protected skillRows = computed(() => this.resource.value()?.skills)
  protected standingXp = computed(() => this.resource.value()?.skillsXp)
}

export interface Row {
  recipeId: string
  itemId: string
  count: number
  data: RowData
}

export interface RowData {
  item: MasterItemDefinitions | HouseItems
  recipe: CraftingRecipeData
  skill: NwTradeSkillInfo
  skillXp: number
  standingXp: number
}

function flattenTree(step: CraftingStepWithAmount): Row[] {
  const result = new Map<string, Row>()
  walkTree(step, (node) => {
    const itemId = node.ingredient?.type === 'Item' ? node.ingredient.id : node.selection
    if (!result.has(itemId)) {
      result.set(itemId, {
        recipeId: node.recipeId,
        itemId: itemId,
        count: 0,
        data: null,
      })
    }
    result.get(itemId).count += node.amount
  })
  return Array.from(result.values())
}

function walkTree(step: CraftingStepWithAmount, fn: (step: CraftingStepWithAmount) => void) {
  if (step?.expand) {
    fn(step)
    for (const subStep of step.steps || []) {
      walkTree(subStep, fn)
    }
  }
}

async function resolveRowData(db: NwData, row: Row): Promise<RowData> {
  const recipe = await db.recipesById(row.recipeId)
  const event = await db.gameEventsById(recipe?.GameEventID)

  return {
    item: await db.itemOrHousingItem(row.itemId),
    skill: await db.tradeskillById(recipe?.Tradeskill),
    recipe: recipe,
    skillXp: event ? getCraftingSkillXP(recipe, event) : 0,
    standingXp: event ? getCraftingStandingXP(recipe, event) : 0,
  }
}

function aggregateStandingXP(rows: Row[]) {
  const bonus = 1.05
  let result = 0
  for (const row of rows) {
    result += (row.data.standingXp || 0) * row.count * bonus
  }
  return Math.floor(result)
}

export interface SkillStatsRow {
  id: string
  label: string
  icon: string
  xp: number
  steps: SkillStatsSubRow[]
}

export interface SkillStatsSubRow {
  count: number
  label: string
  icon: string
  xp: number

  itemId: string
  item: MasterItemDefinitions | HouseItems
}

function aggregateSkills(rows: Row[]) {
  const result = new Map<string, SkillStatsRow>()

  const skillGroups = groupBy(rows, (it) => it.data.skill?.ID)
  for (const [skillId, data] of Object.entries(skillGroups)) {
    if (!skillId) {
      continue
    }
    if (!result.has(skillId)) {
      const skill = data[0].data.skill
      result.set(skillId, {
        id: skillId,
        icon: skill.Icon,
        label: skill.ID,
        xp: 0,
        steps: [],
      })
    }

    const skillRow = result.get(skillId)

    const recipeGroups = groupBy(data, (it) => it.data.recipe?.RecipeID)
    for (const [recipeId, steps] of Object.entries(recipeGroups)) {
      const data = steps[0].data
      skillRow.xp += sumBy(steps, (it) => it.count * it.data.skillXp)
      skillRow.steps.push({
        count: sumBy(steps, (it) => it.count),
        xp: data.skillXp,
        icon: data.item.IconPath,
        label: data.item.Name,

        itemId: steps[0].itemId,
        item: data.item,
      })
    }
  }
  return Array.from(result.values())
}
