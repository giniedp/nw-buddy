import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_STATUSEFFECT, Statuseffect } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
import {
  StatusEffectTableRecord,
  statusEffectColBaseDuration,
  statusEffectColDescription,
  statusEffectColEffectCategories,
  statusEffectColIcon,
  statusEffectColName,
  statusEffectColSource,
  statusEffectColStatusID,
} from './status-effect-table-cols'

@Injectable()
export class StatusEffectTableAdapter
  implements DataViewAdapter<StatusEffectTableRecord>, DataGridAdapter<StatusEffectTableRecord>
{
  private db = inject(NwDbService)
  private utils: DataTableUtils<StatusEffectTableRecord> = inject(DataTableUtils)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })

  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategories(item: Statuseffect): DataTableCategory[] {
    return [
      {
        id: item['$source'],
        label: item['$source'],
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<Statuseffect> {
    return null
  }

  public gridOptions(): GridOptions<StatusEffectTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildStatusEffectTableOptions(this.utils)
  }

  public connect() {
    return (
      this.config?.source ||
      this.db.statusEffects
        .pipe(map((list) => sortBy(list, (it) => it.StatusID)))
        .pipe(map((list) => sortBy(list, (it) => (it.Description ? -1 : 1))))
    )
  }
}

function buildStatusEffectTableOptions(util: DataTableUtils<StatusEffectTableRecord>) {
  const result: GridOptions<StatusEffectTableRecord> = {
    columnDefs: [
      statusEffectColIcon(util),
      statusEffectColStatusID(util),
      statusEffectColSource(util),
      statusEffectColName(util),
      statusEffectColDescription(util),
      statusEffectColBaseDuration(util),
      statusEffectColEffectCategories(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_STATUSEFFECT,
  })
  return result
}
