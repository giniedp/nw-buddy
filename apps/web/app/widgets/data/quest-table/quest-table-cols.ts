import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { Objective } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type QuestTableUtils = TableGridUtils<QuestTableRecord>
export type QuestTableRecord = Objective

export function questColIcon(util: QuestTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.tipLink('perk', String(data.ObjectiveID)) },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: getQuestTypeIcon(data.Type) || NW_FALLBACK_ICON,
          })
        )
      )
    }),
  })
}
export function questColObjectiveID(util: QuestTableUtils) {
  return util.colDef({
    colId: 'objectiveID',
    headerValueGetter: () => 'ID',
    hide: true,
  })
}
export function questColTitle(util: QuestTableUtils) {
  return util.colDef({
    colId: 'title',
    headerValueGetter: () => 'Title',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.Title)),
    getQuickFilterText: ({ value }) => value,
  })
}
export function questColDescription(util: QuestTableUtils) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.Description)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
  })
}
export function questColPlayerPrompt(util: QuestTableUtils) {
  return util.colDef({
    colId: 'playerPrompt',
    headerValueGetter: () => 'Player Prompt',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.PlayerPrompt)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColObjectiveProposalResponse(util: QuestTableUtils) {
  return util.colDef({
    colId: 'objectiveProposalResponse',
    headerValueGetter: () => 'Objective Proposal Response',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.ObjectiveProposalResponse)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColInProgressResponse(util: QuestTableUtils) {
  return util.colDef({
    colId: 'inProgressResponse',
    headerValueGetter: () => 'In Progress Response',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.InProgressResponse)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColDestinationCompletionAvailablePrompt(util: QuestTableUtils) {
  return util.colDef({
    colId: 'destinationCompletionAvailablePrompt',
    headerValueGetter: () => 'Destination Completion Available Prompt',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.DestinationCompletionAvailablePrompt)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColDestinationCompletionAvailableResponse(util: QuestTableUtils) {
  return util.colDef({
    colId: 'destinationCompletionAvailableResponse',
    headerValueGetter: () => 'Destination Completion Available Response',
    width: 350,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.DestinationCompletionAvailableResponse)),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}

export function questColDifficultyLevel(util: QuestTableUtils) {
  return util.colDef({
    colId: 'difficultyLevel',
    headerValueGetter: () => 'Difficulty Level',
    field: util.fieldName('DifficultyLevel'),
    filter: 'agNumberColumnFilter',
  })
}
export function questColRequiredLevel(util: QuestTableUtils) {
  return util.colDef({
    colId: 'requiredLevel',
    headerValueGetter: () => 'Required Level',
    field: util.fieldName('RequiredLevel'),
    filter: 'agNumberColumnFilter',
    hide: true,
  })
}
export function questColAchievementId(util: QuestTableUtils) {
  return util.colDef({
    colId: 'achievementId',
    headerValueGetter: () => 'Achievement Id',
    field: util.fieldName('AchievementId'),
    hide: true,
  })
}
export function questColRequiredAchievementId(util: QuestTableUtils) {
  return util.colDef({
    colId: 'requiredAchievementId',
    headerValueGetter: () => 'Required Achievement Id',
    field: util.fieldName('RequiredAchievementId'),
    hide: true,
  })
}
