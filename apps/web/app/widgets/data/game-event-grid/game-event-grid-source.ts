import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GAMEEVENT } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { humanize } from '~/utils'

import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  GameEventGridRecord,
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
} from './game-event-grid-cols'

@Injectable()
export class GameEventGridSource extends DataGridSource<GameEventGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<GameEventGridRecord> = inject(DataGridUtils)

  public override entityID(item: GameEventGridRecord): string {
    return item.EventID
  }

  public override entityCategories(item: GameEventGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<GameEventGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || this.db.gameEvents
  }
}

function buildOptions(utils: DataGridUtils<GameEventGridRecord>) {
  const result: GridOptions<GameEventGridRecord> = {
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
