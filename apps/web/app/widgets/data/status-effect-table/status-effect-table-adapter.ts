import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_STATUSEFFECT, Statuseffect } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { DataTableCategory } from '~/ui/data/table-grid'
import { addGenericColumns } from '~/ui/data/table-grid'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
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
import { StatusEffectCellComponent } from './status-effect-cell.component'
import { selectStream } from '~/utils'

@Injectable()
export class StatusEffectTableAdapter
  implements DataViewAdapter<StatusEffectTableRecord>, TableGridAdapter<StatusEffectTableRecord>
{
  private db = inject(NwDbService)
  private utils: TableGridUtils<StatusEffectTableRecord> = inject(TableGridUtils)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

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
    if (this.config?.virtualOptions) {
      return this.config.virtualOptions()
    }
    return StatusEffectCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<StatusEffectTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildStatusEffectTableOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  protected source$ = selectStream(this.config?.source || this.db.statusEffects, (list) => {
    if (this.config?.filter) {
      list = list.filter(this.config.filter)
    }
    if (this.config?.sort) {
      list = [...list].sort(this.config.sort)
    } else {
      list = sortBy(list, (it) => it.StatusID)
      list = sortBy(list, (it) => (it.Description ? -1 : 1))
    }
    return list
  })
}

function buildStatusEffectTableOptions(util: TableGridUtils<StatusEffectTableRecord>) {
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
