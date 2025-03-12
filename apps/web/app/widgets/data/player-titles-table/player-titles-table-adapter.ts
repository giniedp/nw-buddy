import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_PLAYERTITLEDATA, PlayerTitleData } from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data/nw-data/provider'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import {
  PlayertitlesTableRecord,
  playerTitleColDescription,
  playerTitleColID,
  playerTitleColNameFemale,
  playerTitleColNameMale,
  playerTitleColNameNeutral,
  playerTitleColRequiredLevel,
  playerTitleColTradeSkill,
  playerTitleColTradeSkillLevel,
  playerTitleColType,
} from './player-titles-table-cols'

@Injectable()
export class PlayerTitlesTableAdapter implements DataViewAdapter<PlayertitlesTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<PlayertitlesTableRecord>({ optional: true })
  private utils: TableGridUtils<PlayertitlesTableRecord> = inject(TableGridUtils)

  public entityID(item: PlayertitlesTableRecord): string {
    return item.TitleID.toLowerCase()
  }

  public entityCategories(item: PlayertitlesTableRecord): DataTableCategory[] {
    if (!item.UIDisplayCategory) {
      return null
    }
    return [
      {
        id: item.UIDisplayCategory.toLowerCase(),
        label: humanize(item.UIDisplayCategory),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<PlayerTitleData> {
    return null
  }

  public gridOptions(): GridOptions<PlayertitlesTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return from(this.db.playerTitlesAll())
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
    props: COLS_PLAYERTITLEDATA,
  })
  return result
}
