import { Inject, Injectable, Optional } from '@angular/core'
import { COLS_GAMEEVENT } from '@nw-data/generated'
import { GameEvent } from '@nw-data/generated'
import { ColDef, GridOptions } from '@ag-grid-community/core'
import { Observable, defer, map, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class GameEventsTableAdapterConfig extends DataTableAdapterOptions<GameEvent> {
  hideUserData?: boolean
}

@Injectable()
export class GameEventsTableAdapter extends DataTableAdapter<GameEvent> {
  public static provider(config?: GameEventsTableAdapterConfig) {
    return dataTableProvider({
      adapter: GameEventsTableAdapter,
      options: config,
    })
  }

  public entityID(item: GameEvent): string {
    return item.EventID
  }

  public entityCategory(item: GameEvent): DataTableCategory {
    if (!item.GameEventType) {
      return null
    }
    return {
      value: item.GameEventType,
      label: humanize(item.GameEventType),
      icon: '',
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'eventID',
          headerValueGetter: () => 'ID',
          field: this.fieldName('EventID'),
          width: 300,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'level',
          headerValueGetter: () => 'Level',
          field: this.fieldName('Level'),
        }),
        this.colDef({
          colId: 'gameEventType',
          headerValueGetter: () => 'Event Type',
          field: this.fieldName('GameEventType'),
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'pvpXp',
          headerValueGetter: () => 'Pvp Xp',
          field: this.fieldName('PvpXp'),
        }),
        this.colDef({
          colId: 'seasonsXp',
          headerValueGetter: () => 'Seasons Xp',
          field: this.fieldName('SeasonsXp'),
        }),
        this.colDef({
          colId: 'universalExpAmount',
          headerValueGetter: () => 'Universal Xp',
          field: this.fieldName('UniversalExpAmount'),
        }),
        this.colDef({
          colId: 'useRestedExp',
          headerValueGetter: () => 'Use Rested Exp',
          field: this.fieldName('UseRestedExp'),
        }),
        this.colDef({
          colId: 'azothReward',
          headerValueGetter: () => 'Azoth Reward',
          field: this.fieldName('AzothReward'),
          hide: true,
        }),
        this.colDef({
          colId: 'azothRewardChance',
          headerValueGetter: () => 'Azoth Reward Chance',
          field: this.fieldName('AzothRewardChance'),
          hide: true,
        }),
        this.colDef({
          colId: 'azothSalt',
          headerValueGetter: () => 'Azoth Salt',
          field: this.fieldName('AzothSalt'),
        }),
        this.colDef({
          colId: 'azothSaltChance',
          headerValueGetter: () => 'Azoth Salt Chance',
          field: this.fieldName('AzothSaltChance'),
          hide: true,
        }),
        this.colDef({
          colId: 'categoricalProgressionId',
          headerValueGetter: () => 'Progression',
          field: this.fieldName('CategoricalProgressionId'),
        }),
        this.colDef({
          colId: 'categoricalProgressionReward',
          headerValueGetter: () => 'Progression Reward',
          field: this.fieldName('CategoricalProgressionReward'),
          hide: true,
        }),
        this.colDef({
          colId: 'coinRewardChance',
          headerValueGetter: () => 'Coin Reward Chance',
          field: this.fieldName('CoinRewardChance'),
        }),
        this.colDef({
          colId: 'CreatureType',
          headerValueGetter: () => 'Creature Type',
          field: this.fieldName('CreatureType'),
        }),
        this.colDef({
          colId: 'currencyReward',
          headerValueGetter: () => 'Currency Reward',
          field: this.fieldName('CurrencyReward'),
        }),
        this.colDef({
          colId: 'factionInfluenceAmount',
          headerValueGetter: () => 'Faction Influence Amount',
          field: this.fieldName('FactionInfluenceAmount'),
        }),
        this.colDef({
          colId: 'factionInfluenceSrc',
          headerValueGetter: () => 'Faction Influence Src',
          field: this.fieldName('FactionInfluenceSrc'),
        }),
        this.colDef({
          colId: 'factionReputation',
          headerValueGetter: () => 'Faction Reputation',
          field: this.fieldName('FactionReputation'),
        }),
        this.colDef({
          colId: 'factionTokens',
          headerValueGetter: () => 'Faction Tokens',
          field: this.fieldName('FactionTokens'),
        }),
        this.colDef({
          colId: 'gearScoreRange',
          headerValueGetter: () => 'Gear Score Range',
          field: this.fieldName('GearScoreRange'),
        }),
        this.colDef({
          colId: 'itemReward',
          headerValueGetter: () => 'Item Reward',
          field: this.fieldName('ItemReward'),
        }),
        this.colDef({
          colId: 'itemRewardQty',
          headerValueGetter: () => 'Item Reward Qty',
          field: this.fieldName('ItemRewardQty'),
        }),
        this.colDef({
          colId: 'leaderboardValue',
          headerValueGetter: () => 'Leaderboard Value',
          field: this.fieldName('LeaderboardValue'),
        }),
        this.colDef({
          colId: 'lootLimitId',
          headerValueGetter: () => 'Loot Limit Id',
          field: this.fieldName('LootLimitId'),
        }),
        this.colDef({
          colId: 'lootLimitReachedGameEventId',
          headerValueGetter: () => 'Loot Limit Reached GameEvent Id',
          field: this.fieldName('LootLimitReachedGameEventId'),
        }),
        this.colDef({
          colId: 'lootTags',
          headerValueGetter: () => 'Loot Tags',
          field: this.fieldName('LootTags'),
        }),
      ],
    })
  ).pipe(map((options) => appendFields(options, Array.from(Object.entries(COLS_GAMEEVENT)))))

  public entities: Observable<GameEvent[]> = defer(() => {
    return this.config?.source || this.db.gameEvents
  }).pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    @Inject(DataTableAdapterOptions)
    @Optional()
    private config: GameEventsTableAdapterConfig
  ) {
    super()
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
