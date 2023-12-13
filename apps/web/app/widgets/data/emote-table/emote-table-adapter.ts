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
  EmoteTableRecord,
  emoteColDescription,
  emoteColHasCooldown,
  emoteColID,
  emoteColIcon,
  emoteColIsEnabled,
  emoteColIsEntitlement,
  emoteColIsPremiumEmote,
  emoteColName,
  emoteColSlashCommand,
} from './emote-table-cols'

@Injectable()
export class EmoteTableAdapter implements DataViewAdapter<EmoteTableRecord>, TableGridAdapter<EmoteTableRecord> {
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<EmoteTableRecord> = inject(TableGridUtils)

  public entityID(item: EmoteTableRecord): string {
    return item.UniqueTagID
  }

  public entityCategories(item: EmoteTableRecord): DataTableCategory[] {
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

  public gridOptions(): GridOptions<EmoteTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.db.emotes
  }
}

function buildOptions(util: TableGridUtils<EmoteTableRecord>) {
  const result: GridOptions<EmoteTableRecord> = {
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
