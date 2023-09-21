import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GAMEEVENT } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { humanize } from '~/utils'

import { DATA_TABLE_SOURCE_OPTIONS, DataTableSource, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  GameEventTableRecord,
  gameEventColAzothReward,
  gameEventColAzothRewardChance,
  gameEventColAzothSalt,
  gameEventColAzothSaltChance,
  gameEventColCategoricalProgressionID,
  gameEventColCategoricalProgressionReward,
  gameEventColCoinRewardChance,
  gameEventColCreatureType,
  gameEventColCurrencyReward,
  gameEventColFActionInfluenceSrc,
  gameEventColFactionInfluenceAmount,
  gameEventColFactionReputation,
  gameEventColFactionTokens,
  gameEventColGearScoreRange,
  gameEventColID,
  gameEventColItemReward,
  gameEventColItemRewardQty,
  gameEventColLeaderboardValue,
  gameEventColLevel,
  gameEventColLootLimitId,
  gameEventColLootLimitReachedGameEventId,
  gameEventColLootTags,
  gameEventColPvpXP,
  gameEventColRestedXP,
  gameEventColSeasonXP,
  gameEventColType,
  gameEventColUniversalXP,
} from './game-event-table-cols'

@Injectable()
export class GameEventTableSource extends DataTableSource<GameEventTableRecord> {
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<GameEventTableRecord> = inject(DataTableUtils)

  public override entityID(item: GameEventTableRecord): string {
    return item.EventID
  }

  public override entityCategories(item: GameEventTableRecord): DataTableCategory[] {
    if (!item.GameEventType) {
      return null
    }
    return [
      {
        id: item.GameEventType,
        label: humanize(item.GameEventType),
        icon: '',
      },
    ]
  }

  public override gridOptions(): GridOptions<GameEventTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.gameEvents
  }
}

function buildOptions(utils: DataTableUtils<GameEventTableRecord>) {
  const result: GridOptions<GameEventTableRecord> = {
    columnDefs: [
      gameEventColID(utils),
      gameEventColLevel(utils),
      gameEventColType(utils),
      gameEventColPvpXP(utils),
      gameEventColSeasonXP(utils),
      gameEventColUniversalXP(utils),
      gameEventColRestedXP(utils),
      gameEventColAzothReward(utils),
      gameEventColAzothRewardChance(utils),
      gameEventColAzothSalt(utils),
      gameEventColAzothSaltChance(utils),
      gameEventColCategoricalProgressionID(utils),
      gameEventColCategoricalProgressionReward(utils),
      gameEventColCoinRewardChance(utils),
      gameEventColCreatureType(utils),
      gameEventColCurrencyReward(utils),
      gameEventColFactionInfluenceAmount(utils),
      gameEventColFActionInfluenceSrc(utils),
      gameEventColFactionReputation(utils),
      gameEventColFactionTokens(utils),
      gameEventColGearScoreRange(utils),
      gameEventColItemReward(utils),
      gameEventColItemRewardQty(utils),
      gameEventColLeaderboardValue(utils),
      gameEventColLootLimitId(utils),
      gameEventColLootLimitReachedGameEventId(utils),
      gameEventColLootTags(utils),
    ],
  }
  addGenericColumns(result, {
    props: COLS_GAMEEVENT,
  })
  return result
}
