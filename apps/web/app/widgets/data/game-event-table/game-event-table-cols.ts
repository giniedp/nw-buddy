import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE_BASE,
  getAbilityCategoryTag,
  getWeaponTagLabel,
} from '@nw-data/common'
import { Ability, GameEvent, Statuseffect } from '@nw-data/generated'
import { map, switchMap } from 'rxjs'
import { NwWeaponType } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type GameEventTableUtils = TableGridUtils<GameEventTableRecord>
export type GameEventTableRecord = GameEvent

export function gameEventColID(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'eventID',
    headerValueGetter: () => 'ID',
    field: util.fieldName('EventID'),
    width: 300,
    getQuickFilterText: ({ value }) => value,
  })
}

export function gameEventColLevel(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'level',
    headerValueGetter: () => 'Level',
    field: util.fieldName('Level'),
  })
}

export function gameEventColType(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'gameEventType',
    headerValueGetter: () => 'Event Type',
    valueGetter: util.fieldGetter('GameEventType'),
    filter: SelectFilter,
  })
}

export function gameEventColPvpXP(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'pvpXp',
    headerValueGetter: () => 'Pvp Xp',
    field: util.fieldName('PvpXp'),
  })
}

export function gameEventColSeasonXP(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'seasonsXp',
    headerValueGetter: () => 'Seasons Xp',
    field: util.fieldName('SeasonsXp'),
  })
}

export function gameEventColUniversalXP(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'universalExpAmount',
    headerValueGetter: () => 'Universal Xp',
    field: util.fieldName('UniversalExpAmount'),
  })
}

export function gameEventColRestedXP(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'useRestedExp',
    headerValueGetter: () => 'Use Rested Exp',
    field: util.fieldName('UseRestedExp'),
  })
}

export function gameEventColAzothReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'azothReward',
    headerValueGetter: () => 'Azoth Reward',
    field: util.fieldName('AzothReward'),
    hide: true,
  })
}

export function gameEventColAzothRewardChance(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'azothRewardChance',
    headerValueGetter: () => 'Azoth Reward Chance',
    field: util.fieldName('AzothRewardChance'),
    hide: true,
  })
}

export function gameEventColAzothSalt(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'azothSalt',
    headerValueGetter: () => 'Azoth Salt',
    field: util.fieldName('AzothSalt'),
  })
}

export function gameEventColAzothSaltChance(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'azothSaltChance',
    headerValueGetter: () => 'Azoth Salt Chance',
    field: util.fieldName('AzothSaltChance'),
    hide: true,
  })
}

export function gameEventColCategoricalProgressionID(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'categoricalProgressionId',
    headerValueGetter: () => 'Progression',
    field: util.fieldName('CategoricalProgressionId'),
  })
}

export function gameEventColCategoricalProgressionReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'categoricalProgressionReward',
    headerValueGetter: () => 'Progression Reward',
    field: util.fieldName('CategoricalProgressionReward'),
    hide: true,
  })
}

export function gameEventColCoinRewardChance(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'coinRewardChance',
    headerValueGetter: () => 'Coin Reward Chance',
    field: util.fieldName('CoinRewardChance'),
  })
}

export function gameEventColCreatureType(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'CreatureType',
    headerValueGetter: () => 'Creature Type',
    field: util.fieldName('CreatureType'),
  })
}

export function gameEventColCurrencyReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'currencyReward',
    headerValueGetter: () => 'Currency Reward',
    field: util.fieldName('CurrencyReward'),
  })
}

export function gameEventColFactionInfluenceAmount(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionInfluenceAmount',
    headerValueGetter: () => 'Faction Influence Amount',
    field: util.fieldName('FactionInfluenceAmount'),
  })
}

export function gameEventColFActionInfluenceSrc(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionInfluenceSrc',
    headerValueGetter: () => 'Faction Influence Src',
    field: util.fieldName('FactionInfluenceSrc'),
  })
}

export function gameEventColFactionReputation(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionReputation',
    headerValueGetter: () => 'Faction Reputation',
    field: util.fieldName('FactionReputation'),
  })
}

export function gameEventColFactionTokens(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'factionTokens',
    headerValueGetter: () => 'Faction Tokens',
    field: util.fieldName('FactionTokens'),
  })
}

export function gameEventColGearScoreRange(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'gearScoreRange',
    headerValueGetter: () => 'Gear Score Range',
    field: util.fieldName('GearScoreRange'),
  })
}

export function gameEventColItemReward(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'itemReward',
    headerValueGetter: () => 'Item Reward',
    field: util.fieldName('ItemReward'),
  })
}

export function gameEventColItemRewardQty(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'itemRewardQty',
    headerValueGetter: () => 'Item Reward Qty',
    field: util.fieldName('ItemRewardQty'),
  })
}

export function gameEventColLeaderboardValue(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'leaderboardValue',
    headerValueGetter: () => 'Leaderboard Value',
    field: util.fieldName('LeaderboardValue'),
  })
}

export function gameEventColLootLimitId(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootLimitId',
    headerValueGetter: () => 'Loot Limit Id',
    field: util.fieldName('LootLimitId'),
  })
}

export function gameEventColLootLimitReachedGameEventId(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootLimitReachedGameEventId',
    headerValueGetter: () => 'Loot Limit Reached GameEvent Id',
    field: util.fieldName('LootLimitReachedGameEventId'),
  })
}

export function gameEventColLootTags(util: GameEventTableUtils) {
  return util.colDef({
    colId: 'lootTags',
    headerValueGetter: () => 'Loot Tags',
    field: util.fieldName('LootTags'),
  })
}
