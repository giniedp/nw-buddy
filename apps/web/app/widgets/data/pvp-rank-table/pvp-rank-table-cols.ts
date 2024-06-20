import { PvPRankData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type PvpRankTableUtils = TableGridUtils<PvpRankTableRecord>
export type PvpRankTableRecord = PvPRankData

export function pvpRankColLevel(util: PvpRankTableUtils) {
  return util.colDef<number>({
    colId: 'level',
    headerValueGetter: () => 'Level',
    field: 'Level',
  })
}

export function pvpRankColName(util: PvpRankTableUtils) {
  return util.colDef<string>({
    colId: 'displayName',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(data.DisplayName),
  })
}

export function pvpRankColGameEvent(util: PvpRankTableUtils) {
  return util.colDef<string>({
    colId: 'gameEventId',
    headerValueGetter: () => 'Game Event',
    width: 250,
    field: 'GameEventId',
  })
}

export function pvpRankColDescription(util: PvpRankTableUtils) {
  return util.colDef<string>({
    colId: 'rewardDescription',
    headerValueGetter: () => 'Reward Desciption',
    width: 250,
    valueGetter: ({ data }) => util.i18n.get(data.RewardDescription),
  })
}
