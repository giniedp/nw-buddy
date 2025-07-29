import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { GameEventData, Objectives } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type QuestTableUtils = TableGridUtils<QuestTableRecord>
export type QuestTableRecord = Objectives & {
  $gameEvent: GameEventData
}

export function questColIcon(util: QuestTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: data.ObjectiveID ? util.tipLink('quest', String(data.ObjectiveID)) : '' },
        },
        util.elPicture(
          {
            class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          },
          util.elImg({
            src: getQuestTypeIcon(data.Type) || NW_FALLBACK_ICON,
          }),
        ),
      )
    }),
  })
}
export function questColObjectiveID(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'objectiveID',
    headerValueGetter: () => 'ID',
    field: 'ObjectiveID',
    hide: true,
  })
}
export function questColTitle(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'title',
    headerValueGetter: () => 'Title',
    width: 250,
    valueGetter: ({ data }) => {
      return data.Title ? util.i18n.get(data.Title) : humanize(data.ObjectiveID)
    },
    cellClass: ({ data }) => {
      const css: string[] = []
      if (!data.Title) {
        css.push('text-gray-400')
      }
      return css
    },
  })
}
export function questColDescription(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.Description),
    cellRenderer: util.cellRenderer(({ value }) => value?.replace(/\\n/g, '<br>')),
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
  })
}
export function questColType(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'type',
    headerValueGetter: () => 'Type',
    valueFormatter: ({ value }) => humanize(value),
    field: 'Type',
    width: 350,
    ...util.selectFilter({
      search: true,
    }),
  })
}
export function questColPlayerPrompt(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'playerPrompt',
    headerValueGetter: () => 'Player Prompt',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.PlayerPrompt),
    valueFormatter: ({ value }) => value?.replace(/\\n/g, '<br>'),
    cellRenderer: ({ value }) => value,
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColObjectiveProposalResponse(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'objectiveProposalResponse',
    headerValueGetter: () => 'Objective Proposal Response',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.ObjectiveProposalResponse),
    valueFormatter: ({ value }) => value?.replace(/\\n/g, '<br>'),
    cellRenderer: ({ value }) => value,
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColInProgressResponse(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'inProgressResponse',
    headerValueGetter: () => 'In Progress Response',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.InProgressResponse),
    valueFormatter: ({ value }) => value?.replace(/\\n/g, '<br>'),
    cellRenderer: ({ value }) => value,
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColDestinationCompletionAvailablePrompt(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'destinationCompletionAvailablePrompt',
    headerValueGetter: () => 'Destination Completion Available Prompt',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.DestinationCompletionAvailablePrompt),
    valueFormatter: ({ value }) => value?.replace(/\\n/g, '<br>'),
    cellRenderer: ({ value }) => value,
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}
export function questColDestinationCompletionAvailableResponse(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'destinationCompletionAvailableResponse',
    headerValueGetter: () => 'Destination Completion Available Response',
    width: 350,
    valueGetter: ({ data }) => util.i18n.get(data.DestinationCompletionAvailableResponse),
    valueFormatter: ({ value }) => value?.replace(/\\n/g, '<br>'),
    cellRenderer: ({ value }) => value,
    cellClass: ['multiline-cell', 'py-2'],
    autoHeight: true,
    hide: true,
  })
}

export function questColDifficultyLevel(util: QuestTableUtils) {
  return util.colDef<number>({
    colId: 'difficultyLevel',
    headerValueGetter: () => 'Difficulty Level',
    getQuickFilterText: () => '',
    field: 'DifficultyLevel',
    filter: 'agNumberColumnFilter',
  })
}
export function questColRequiredLevel(util: QuestTableUtils) {
  return util.colDef<number>({
    colId: 'requiredLevel',
    headerValueGetter: () => 'Required Level',
    getQuickFilterText: () => '',
    field: 'RequiredLevel',
    filter: 'agNumberColumnFilter',
    hide: true,
  })
}
export function questColAchievementId(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'achievementId',
    headerValueGetter: () => 'Achievement Id',
    field: 'AchievementId',
    hide: true,
  })
}
export function questColRequiredAchievementId(util: QuestTableUtils) {
  return util.colDef<string>({
    colId: 'requiredAchievementId',
    headerValueGetter: () => 'Required Achievement Id',
    field: 'RequiredAchievementId',
    hide: true,
  })
}
