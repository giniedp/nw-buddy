import { GameEventData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type GameEventTableUtils = TableGridUtils<GameEventTableRecord>
export type GameEventTableRecord = GameEventData

export function gameEventColID(util: GameEventTableUtils) {
  return util.colDef<string>({
    colId: 'eventID',
    headerValueGetter: () => 'ID',
    field: 'EventID',
    width: 300,
  })
}

export function gameEventColLevel(util: GameEventTableUtils) {
  return util.colDef<number>({
    colId: 'level',
    headerValueGetter: () => 'Level',
    field: 'Level',
    getQuickFilterText: () => '',
  })
}

export function gameEventColType(util: GameEventTableUtils) {
  return util.colDef<string>({
    colId: 'gameEventType',
    headerValueGetter: () => 'Event Type',
    field: 'GameEventType',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function gameEventColPvpXP(util: GameEventTableUtils) {
  return util.colDef<number>({
    colId: 'pvpXp',
    headerValueGetter: () => 'Pvp Xp',
    field: 'PvpXp',
    getQuickFilterText: () => '',
  })
}

export function gameEventColSeasonXP(util: GameEventTableUtils) {
  return util.colDef<number>({
    colId: 'seasonsXp',
    headerValueGetter: () => 'Seasons Xp',
    field: 'SeasonsXp',
    getQuickFilterText: () => '',
  })
}

export function gameEventColUniversalXP(util: GameEventTableUtils) {
  return util.colDef<string | number>({
    colId: 'universalExpAmount',
    headerValueGetter: () => 'Universal Xp',
    field: 'UniversalExpAmount',
    getQuickFilterText: () => '',
  })
}

export function gameEventColRestedXP(util: GameEventTableUtils) {
  return util.colDef<string | number>({
    colId: 'useRestedExp',
    headerValueGetter: () => 'Use Rested Exp',
    field: 'UseRestedExp',
    getQuickFilterText: () => '',
  })
}

export function gameEventColAzothReward(util: GameEventTableUtils) {
  return util.colDef<string | number>({
    colId: 'azothReward',
    headerValueGetter: () => 'Azoth Reward',
    field: 'AzothReward',
    getQuickFilterText: () => '',
    hide: true,
  })
}

export function gameEventColAzothRewardChance(util: GameEventTableUtils) {
  return util.colDef<string | number>({
    colId: 'azothRewardChance',
    headerValueGetter: () => 'Azoth Reward Chance',
    field: 'AzothRewardChance',
    getQuickFilterText: () => '',
    hide: true,
  })
}

export function gameEventColAzothSalt(util: GameEventTableUtils) {
  return util.colDef<string | number>({
    colId: 'azothSalt',
    headerValueGetter: () => 'Azoth Salt',
    field: 'AzothSalt',
    getQuickFilterText: () => '',
  })
}

export function gameEventColAzothSaltChance(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'azothSaltChance',
    headerValueGetter: () => 'Azoth Salt Chance',
    field: 'AzothSaltChance',
    getQuickFilterText: () => '',
    hide: true,
  })
}

export function gameEventColCategoricalProgressionID(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'categoricalProgressionId',
    headerValueGetter: () => 'Progression',
    field: 'CategoricalProgressionId',
  })
}

export function gameEventColCategoricalProgressionReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'categoricalProgressionReward',
    headerValueGetter: () => 'Progression Reward',
    field: 'CategoricalProgressionReward',
    hide: true,
  })
}

export function gameEventColCoinRewardChance(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'coinRewardChance',
    headerValueGetter: () => 'Coin Reward Chance',
    field: 'CoinRewardChance',
    getQuickFilterText: () => '',
  })
}

export function gameEventColCreatureType(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'CreatureType',
    headerValueGetter: () => 'Creature Type',
    field: 'CreatureType',
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function gameEventColCurrencyReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'currencyReward',
    headerValueGetter: () => 'Currency Reward',
    field: 'CurrencyReward',
    getQuickFilterText: () => '',
  })
}

export function gameEventColFactionInfluenceAmount(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionInfluenceAmount',
    headerValueGetter: () => 'Faction Influence Amount',
    field: 'FactionInfluenceAmount',
    getQuickFilterText: () => '',
  })
}

export function gameEventColFActionInfluenceSrc(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionInfluenceSrc',
    headerValueGetter: () => 'Faction Influence Src',
    field: 'FactionInfluenceSrc',
    getQuickFilterText: () => '',
  })
}

export function gameEventColFactionReputation(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionReputation',
    headerValueGetter: () => 'Faction Reputation',
    field: 'FactionReputation',
    getQuickFilterText: () => '',
  })
}

export function gameEventColFactionTokens(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionTokens',
    headerValueGetter: () => 'Faction Tokens',
    field: 'FactionTokens',
    getQuickFilterText: () => '',
  })
}

export function gameEventColGearScoreRange(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'gearScoreRange',
    headerValueGetter: () => 'Gear Score Range',
    field: 'GearScoreRange',
    getQuickFilterText: () => '',
  })
}

export function gameEventColItemReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'itemReward',
    headerValueGetter: () => 'Item Reward',
    field: 'ItemReward',
    getQuickFilterText: () => '',
  })
}

export function gameEventColItemRewardQty(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'itemRewardQty',
    headerValueGetter: () => 'Item Reward Qty',
    field: 'ItemRewardQty',
    getQuickFilterText: () => '',
  })
}

export function gameEventColLeaderboardValue(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'leaderboardValue',
    headerValueGetter: () => 'Leaderboard Value',
    field: 'LeaderboardValue',
    getQuickFilterText: () => '',
  })
}

export function gameEventColLootLimitId(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootLimitId',
    headerValueGetter: () => 'Loot Limit Id',
    field: 'LootLimitId',
    getQuickFilterText: () => '',
  })
}

export function gameEventColLootLimitReachedGameEventId(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootLimitReachedGameEventId',
    headerValueGetter: () => 'Loot Limit Reached GameEvent Id',
    field: 'LootLimitReachedGameEventId',
    getQuickFilterText: () => '',
  })
}

export function gameEventColLootTags(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    field: 'LootTags',
    getQuickFilterText: () => '',
  })
}
