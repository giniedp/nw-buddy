import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_PLAYERTITLES, Playertitles } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  PlayertitlesTableRecord,
  playerTitleColID,
  playerTitleColDescription,
  playerTitleColNameFemale,
  playerTitleColNameMale,
  playerTitleColNameNeutral,
  playerTitleColRequiredLevel,
  playerTitleColType,
  playerTitleColTradeSkill,
  playerTitleColTradeSkillLevel,
} from './player-titles-table-cols'
import { humanize } from '~/utils'

@Injectable()
export class PlayerTitlesTableAdapter
  implements DataViewAdapter<PlayertitlesTableRecord>, TableGridAdapter<PlayertitlesTableRecord>
{
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<PlayertitlesTableRecord> = inject(TableGridUtils)

  public entityID(item: PlayertitlesTableRecord): string {
    return item.TitleID
  }

  public entityCategories(item: PlayertitlesTableRecord): DataTableCategory[] {
    if (!item.UIDisplayCategory) {
      return null
    }
    return [
      {
        id: item.UIDisplayCategory,
        label: humanize(item.UIDisplayCategory),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<Playertitles> {
    return null
  }

  public gridOptions(): GridOptions<PlayertitlesTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.db.playerTitles
  }
}

function buildOptions(util: TableGridUtils<PlayertitlesTableRecord>) {
  const result: GridOptions<PlayertitlesTableRecord> = {
    columnDefs: [
      playerTitleColID(util),
      playerTitleColNameFemale(util),
      playerTitleColNameMale(util),
      playerTitleColNameNeutral(util),
      playerTitleColDescription(util),
      playerTitleColType(util),
      playerTitleColRequiredLevel(util),
      playerTitleColTradeSkill(util),
      playerTitleColTradeSkillLevel(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_PLAYERTITLES,
  })
  return result
}
