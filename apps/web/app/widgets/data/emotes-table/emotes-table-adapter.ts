import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_EMOTEDEFINITIONS, Emotedefinitions } from '@nw-data/generated'
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
  EmotesTableRecord,
  emoteColDescription,
  emoteColHasCooldown,
  emoteColID,
  emoteColIcon,
  emoteColIsEnabled,
  emoteColIsEntitlement,
  emoteColIsPremiumEmote,
  emoteColName,
  emoteColSlashCommand,
} from './emotes-table-cols'

@Injectable()
export class EmotesTableAdapter implements DataViewAdapter<EmotesTableRecord>, TableGridAdapter<EmotesTableRecord> {
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<EmotesTableRecord> = inject(TableGridUtils)

  public entityID(item: EmotesTableRecord): string {
    return item.UniqueTagID
  }

  public entityCategories(item: EmotesTableRecord): DataTableCategory[] {
    if (!item.DisplayGroup) {
      return null
    }
    return [
      {
        id: item.DisplayGroup,
        label: item.DisplayGroup,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<Emotedefinitions> {
    return null
  }

  public gridOptions(): GridOptions<EmotesTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.db.emotes
  }
}

function buildOptions(util: TableGridUtils<EmotesTableRecord>) {
  const result: GridOptions<EmotesTableRecord> = {
    columnDefs: [
      emoteColIcon(util),
      emoteColID(util),
      emoteColName(util),
      emoteColDescription(util),
      emoteColSlashCommand(util),
      emoteColIsEnabled(util),
      emoteColIsEntitlement(util),
      emoteColIsPremiumEmote(util),
      emoteColHasCooldown(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_EMOTEDEFINITIONS,
  })
  return result
}
