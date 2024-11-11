import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_EMOTEDATA, EmoteData } from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
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
export class EmoteTableAdapter implements DataViewAdapter<EmoteTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<EmoteTableRecord>({ optional: true })
  private utils: TableGridUtils<EmoteTableRecord> = inject(TableGridUtils)

  public entityID(item: EmoteTableRecord): string {
    return item.UniqueTagID.toLowerCase()
  }

  public entityCategories(item: EmoteTableRecord): DataTableCategory[] {
    if (!item.DisplayGroup) {
      return null
    }
    return [
      {
        id: item.DisplayGroup.toLowerCase(),
        label: item.DisplayGroup,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<EmoteData> {
    return null
  }

  public gridOptions(): GridOptions<EmoteTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return from(this.db.emotesAll())
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
    props: COLS_EMOTEDATA,
  })
  return result
}
