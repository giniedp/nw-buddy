import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NwModule } from '~/nw'
import { apiResource } from '~/utils'

import { RouterModule } from '@angular/router'
import { NwTradeSkillInfo, getCraftingStandingXP } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingRecipeData, HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { injectNwData } from '~/data'
import { LayoutModule, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { TradeskillsModule } from '~/widgets/tradeskills'
import { CraftingBonusesModalComponent } from '../crafting-bonus/crafting-bonuses-modal.component'
import { CraftingBuffStore } from '../crafting-bonus/crafting-buff.store'
import { SummaryRow } from './types'

@Component({
  selector: 'tab-standing',
  templateUrl: './tab-standing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TradeskillsModule, TooltipModule, LayoutModule, ItemDetailModule],
  providers: [],
  host: {
    class: 'block',
  },
})
export class TabStandingComponent {
  private db = injectNwData()
  public summary = input<SummaryRow[]>()
  private store = inject(CraftingBuffStore)
  private modal = inject(ModalService)

  protected resource = apiResource({
    request: this.summary,
    loader: async ({ request }) => {
      return await Promise.all(
        request.map(async (row) => {
          return {
            ...row,
            data: await resolveRowData(this.db, row),
          }
        }),
      )
    },
  })
  protected rows = computed(() => {
    return aggregate(this.resource.value(), this.store.getTerritoryBonusForEXP())
  })

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
    xp: event ? getCraftingStandingXP(recipe, event) : 0,
  }
}

export interface SkillStatsRow {
  id: string
  label: string
  icon: string
  xpSum: number
  xpBonus: number
  xpTotal: number
  buff: number
  steps: SkillStatsSubRow[]
}

export interface SkillStatsSubRow {
  amount: number
  label: string
  icon: string
  xp: number
  xpSum: number
  xpBonus: number
  xpTotal: number

  itemId: string
  item: MasterItemDefinitions | HouseItems
}

function aggregate(rows: Row[], buff: number) {
  const group: SkillStatsRow = {
    id: 'standing',
    label: 'Standing',
    icon: '/assets/icons/territories/icon_territorystanding.png',
    xpSum: 0,
    xpBonus: 0,
    xpTotal: 0,
    buff,
    steps: [],
  }
  const recipeGroups = groupBy(rows, (it) => it.data.recipe?.RecipeID)
  for (const [_, steps] of Object.entries(recipeGroups)) {
    for (const { amount, data, itemId } of steps) {
      const xp = data.xp
      const xpSum = amount * xp
      const xpBonus = Math.floor(xpSum * (1 + buff)) - xpSum
      const xpTotal = xpSum + xpBonus

      group.xpSum += xpSum
      group.xpBonus += xpBonus
      group.xpTotal += xpTotal
      group.steps.push({
        xp,
        xpSum,
        xpBonus,
        xpTotal,
        amount,
        icon: data.item.IconPath,
        label: data.item.Name,
        itemId: itemId,
        item: data.item,
      })
    }
  }

  const result = [group]
  for (const group of result) {
    group.steps = group.steps.filter((it) => !!it.xp)
  }
  return result
}
