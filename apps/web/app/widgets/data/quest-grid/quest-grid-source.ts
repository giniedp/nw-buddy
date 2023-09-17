import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { COLS_OBJECTIVE, Objective } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { humanize } from '~/utils'
import {
  QuestGridRecord,
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
} from './quest-grid-cols'

@Injectable()
export class QuestGridSource extends DataGridSource<QuestGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<QuestGridRecord> = inject(DataGridUtils)

  public override entityID(item: Objective): string | number {
    return item.ObjectiveID
  }

  public override entityCategories(item: Objective): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<QuestGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }
  public connect() {
    return this.config?.source || this.db.quests
  }
}

function buildOptions(util: DataGridUtils<QuestGridRecord>) {
  const result: GridOptions<QuestGridRecord> = {
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
