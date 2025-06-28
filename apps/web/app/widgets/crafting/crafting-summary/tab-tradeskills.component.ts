import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'

import { RouterModule } from '@angular/router'
import { NwTradeSkillInfo, getCraftingSkillXP } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { groupBy, sumBy } from 'lodash'
import { injectNwData } from '~/data'
import { LayoutModule, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { CraftingBonusesModalComponent } from '../crafting-bonus/crafting-bonuses-modal.component'
import { CraftingBuffStore } from '../crafting-bonus/crafting-buff.store'
import { SummaryRow } from './types'

@Component({
  selector: 'tab-tradeskills',
  templateUrl: './tab-tradeskills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    TradeskillsModule,
    TooltipModule,
    LayoutModule,
    ItemDetailModule,
  ],
  providers: [],
  host: {
    class: 'block',
  },
})
export class TabTradeskillsComponent {
  private db = injectNwData()
  public summary = input<SummaryRow[]>()
  private store = inject(CraftingBuffStore)
  private modal = inject(ModalService)

  protected resource = apiResource({
    request: this.summary,
    loader: async ({ request }) => {
      const rows = await Promise.all(
        request.map(async (row) => {
          return {
            ...row,
            data: await resolveRowData(this.db, row),
          }
        }),
      )
      return aggregate(rows)
    },
  })
  protected rows = computed(() => this.resource.value())

  protected openChances(group: string) {
    CraftingBonusesModalComponent.open(this.modal, group)
  }
}

export type Row = SummaryRow & { data: RowData }
export interface RowData {
  item: MasterItemDefinitions | HouseItems
  recipe: CraftingRecipeData
  skill: NwTradeSkillInfo
  xp: number
}

async function resolveRowData(db: NwData, row: SummaryRow): Promise<RowData> {
  const recipe = await db.recipesById(row.recipeId)
  const event = await db.gameEventsById(recipe?.GameEventID)

  return {
    item: await db.itemOrHousingItem(row.itemId),
    skill: await db.tradeskillById(recipe?.Tradeskill),
    recipe: recipe,
    xp: event ? getCraftingSkillXP(recipe, event) : 0,
  }
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

function aggregate(rows: Row[]) {
  const result = new Map<string, SkillStatsRow>()

  const skillGroups = groupBy(rows, (it) => it.data.skill?.ID || '')
  const entries = Object.entries(skillGroups).filter(([skillId]) => !!skillId)
  for (const [skillId, data] of entries) {
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
      skillRow.xp += sumBy(steps, (it) => it.amount * it.data.xp)
      skillRow.steps.push({
        count: sumBy(steps, (it) => it.amount),
        xp: data.xp,
        icon: data.item.IconPath,
        label: data.item.Name,

        itemId: steps[0].itemId,
        item: data.item,
      })
    }
  }
  return Array.from(result.values())
}
