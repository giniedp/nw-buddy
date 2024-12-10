import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { COLS_GAMEEVENTDATA, COLS_OBJECTIVES, Objectives } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize, selectStream } from '~/utils'
import {
  QuestTableRecord,
  questColAchievementId,
  questColDescription,
  questColDestinationCompletionAvailablePrompt,
  questColDestinationCompletionAvailableResponse,
  questColDifficultyLevel,
  questColIcon,
  questColInProgressResponse,
  questColObjectiveID,
  questColObjectiveProposalResponse,
  questColPlayerPrompt,
  questColRequiredAchievementId,
  questColRequiredLevel,
  questColTitle,
  questColType,
} from './quest-table-cols'

@Injectable()
export class QuestTableAdapter implements DataViewAdapter<QuestTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<QuestTableRecord>({ optional: true })
  private utils: TableGridUtils<QuestTableRecord> = inject(TableGridUtils)

  public entityID(item: QuestTableRecord): string | number {
    return item.ObjectiveID.toLowerCase()
  }

  public entityCategories(item: QuestTableRecord): DataTableCategory[] {
    if (!item.Type) {
      return null
    }
    return [
      {
        label: humanize(item.Type),
        id: item.Type.toLowerCase(),
        icon: getQuestTypeIcon(item.Type) || NW_FALLBACK_ICON,
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<QuestTableRecord> {
    return null
  }
  public gridOptions(): GridOptions<QuestTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }
  public connect() {
    return selectStream(
      {
        items: this.config?.source || this.db.objectivesAll(),
        events: this.db.gameEventsByIdMap(),
      },
      ({ items, events }) => {
        return items.map((it: Objectives): QuestTableRecord => {
          return {
            ...it,
            $gameEvent: events.get(it.SuccessGameEventId),
          }
        })
      },
    )
  }
}

function buildOptions(util: TableGridUtils<QuestTableRecord>) {
  const result: GridOptions<QuestTableRecord> = {
    columnDefs: [
      questColIcon(util),
      questColObjectiveID(util),
      questColTitle(util),
      questColDescription(util),
      questColType(util),
      questColPlayerPrompt(util),
      questColObjectiveProposalResponse(util),
      questColInProgressResponse(util),
      questColDestinationCompletionAvailablePrompt(util),
      questColDestinationCompletionAvailableResponse(util),
      questColDifficultyLevel(util),
      questColRequiredLevel(util),
      questColAchievementId(util),
      questColRequiredAchievementId(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_OBJECTIVES,
  })
  addGenericColumns(result, {
    props: COLS_GAMEEVENTDATA,
    scope: '$gameEvent',
  })
  return result
}
