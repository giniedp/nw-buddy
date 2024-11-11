import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GAMEEVENTDATA, GameEventData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { humanize } from '~/utils'

import { from } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
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
export class GameEventTableAdapter implements DataViewAdapter<GameEventTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<GameEventTableRecord>({ optional: true })
  private utils: TableGridUtils<GameEventTableRecord> = inject(TableGridUtils)

  public entityID(item: GameEventTableRecord): string {
    return item.EventID.toLowerCase()
  }

  public entityCategories(item: GameEventTableRecord): DataTableCategory[] {
    if (!item.GameEventType) {
      return null
    }
    return [
      {
        id: item.GameEventType.toLowerCase(),
        label: humanize(item.GameEventType),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<GameEventData> {
    return null
  }

  public gridOptions(): GridOptions<GameEventTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || from(this.db.gameEventsAll())
  }
}

function buildOptions(utils: TableGridUtils<GameEventTableRecord>) {
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
    props: COLS_GAMEEVENTDATA,
  })
  return result
}
