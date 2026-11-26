import { GridOptions } from 'ag-grid-community'
import { Injectable, inject } from '@angular/core'
import { ScannedEncounter } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { humanize } from '~/utils'

import { from } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  EncounterTableRecord,
  encounterColID,
  encounterColName,
  encounterColSpawnCount,
  encounterColTag,
} from './encounter-table-cols'

@Injectable()
export class EncounterTableAdapter implements DataViewAdapter<EncounterTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<EncounterTableRecord>({ optional: true })
  private utils: TableGridUtils<EncounterTableRecord> = inject(TableGridUtils)

  public entityID(item: EncounterTableRecord): string {
    return item.encounterID.toLowerCase()
  }

  public entityCategories(item: EncounterTableRecord): DataTableCategory[] {
    if (!item.tag) {
      return null
    }
    return [
      {
        id: item.tag.toLowerCase(),
        label: humanize(item.tag),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<ScannedEncounter> {
    return null
  }

  public gridOptions(): GridOptions<EncounterTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.config?.source || from(this.db.encounterMetaAll())
  }
}

function buildOptions(utils: TableGridUtils<EncounterTableRecord>) {
  const result: GridOptions<EncounterTableRecord> = {
    columnDefs: [encounterColID(utils), encounterColName(utils), encounterColTag(utils), encounterColSpawnCount(utils)],
  }
  return result
}
