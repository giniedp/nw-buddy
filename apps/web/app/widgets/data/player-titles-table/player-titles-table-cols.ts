import { PlayerTitleData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type PlayertitlesTableUtils = TableGridUtils<PlayertitlesTableRecord>
export type PlayertitlesTableRecord = PlayerTitleData

export function playerTitleColID(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'titleID',
    headerValueGetter: () => 'ID',
    width: 200,
    field: 'TitleID',
    hide: true,
    getQuickFilterText: ({ value }) => value,
  })
}
export function playerTitleColNameMale(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'titleMale',
    headerValueGetter: () => 'Name',
    width: 200,
    valueGetter: ({ data }) => util.tl8(data.TitleMale),
    getQuickFilterText: ({ value }) => value,
  })
}
export function playerTitleColNameFemale(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'titleFemale',
    headerValueGetter: () => 'Name Female',
    width: 200,
    hide: true,
    valueGetter: ({ data }) => util.tl8(data.TitleFemale),
    getQuickFilterText: ({ value }) => value,
  })
}
export function playerTitleColNameNeutral(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'titleNeutral',
    headerValueGetter: () => 'Name Neutral',
    width: 200,
    hide: true,
    valueGetter: ({ data }) => util.tl8(data.TitleNeutral),
    getQuickFilterText: ({ value }) => value,
  })
}
export function playerTitleColDescription(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 400,
    valueGetter: ({ data }) => util.tl8(data.Description),
    cellClass: ['text-nw-description', 'italic'],
    getQuickFilterText: ({ value }) => value,
  })
}

export function playerTitleColRequiredLevel(util: PlayertitlesTableUtils) {
  return util.colDef<number>({
    colId: 'requiredPlayerLevel',
    headerValueGetter: () => 'Player Level',
    field: 'RequiredPlayerLevel',
  })
}

export function playerTitleColType(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'titleType',
    headerValueGetter: () => 'Type',
    field: 'TitleType',
  })
}

export function playerTitleColTradeSkill(util: PlayertitlesTableUtils) {
  return util.colDef<string>({
    colId: 'categoricalProgressionId',
    headerValueGetter: () => 'Trade Skill',
    field: 'CategoricalProgressionId',
  })
}

export function playerTitleColTradeSkillLevel(util: PlayertitlesTableUtils) {
  return util.colDef<number>({
    colId: 'requiredCategoricalProgressionLevel',
    headerValueGetter: () => 'Tradeskill Level',
    field: 'RequiredCategoricalProgressionLevel',
  })
}
