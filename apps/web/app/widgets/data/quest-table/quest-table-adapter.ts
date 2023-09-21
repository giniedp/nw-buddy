import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { COLS_OBJECTIVE, Objective } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
import { humanize } from '~/utils'
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
} from './quest-table-cols'

@Injectable()
export class QuestTableAdapter implements DataViewAdapter<QuestTableRecord>, DataGridAdapter<QuestTableRecord> {
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<QuestTableRecord> = inject(DataTableUtils)

  public entityID(item: Objective): string | number {
    return item.ObjectiveID
  }

  public entityCategories(item: Objective): DataTableCategory[] {
    if (!item.Type) {
      return null
    }
    return [
      {
        label: humanize(item.Type),
        id: item.Type,
        icon: getQuestTypeIcon(item.Type) || NW_FALLBACK_ICON,
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<Objective> {
    return null
  }
  public gridOptions(): GridOptions<QuestTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }
  public connect() {
    return this.config?.source || this.db.quests
  }
}

function buildOptions(util: DataTableUtils<QuestTableRecord>) {
  const result: GridOptions<QuestTableRecord> = {
    columnDefs: [
      questColIcon(util),
      questColObjectiveID(util),
      questColTitle(util),
      questColDescription(util),
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
    props: COLS_OBJECTIVE,
  })
  return result
}
