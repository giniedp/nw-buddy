import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_STATUSEFFECTDATA, StatusEffectData } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { defer } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize, selectStream } from '~/utils'
import { StatusEffectCellComponent } from './status-effect-cell.component'
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
export class StatusEffectTableAdapter implements DataViewAdapter<StatusEffectTableRecord> {
  private db = injectNwData()
  private utils: TableGridUtils<StatusEffectTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<StatusEffectTableRecord>({ optional: true })

  public entityID(item: StatusEffectData): string {
    return item.StatusID.toLowerCase()
  }

  public entityCategories(item: StatusEffectData): DataTableCategory[] {
    const source = (item['$source'] as string).replace('StatusEffects', '')
    return [
      {
        id: source.toLowerCase(),
        label: humanize(source),
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<StatusEffectData> {
    if (this.config?.virtualOptions) {
      return this.config.virtualOptions(this.utils)
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

  protected source$ = selectStream(this.config?.source || defer(() => this.db.statusEffectsAll()), (list) => {
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
    props: COLS_STATUSEFFECTDATA,
  })
  return result
}
