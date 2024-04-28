import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_GATHERABLES, COLS_ITEMDEFINITIONMASTER, Gatherables } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDataService } from '~/data'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridAdapterOptions, TableGridUtils } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { DataTableCategory, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import {
  NpcTableRecord, npcColIcon, npcColId, npcColName, npcColTitle,

} from './npc-table-cols'
import { Observable } from 'rxjs'
import { NpcGridCellComponent } from './npc-cell.component'
import { NpcService } from '../npc-detail'
import { sortBy } from 'lodash'

@Injectable()
export class NpcsTableAdapter
  implements TableGridAdapter<NpcTableRecord>, DataViewAdapter<NpcTableRecord>
{
  private db = inject(NwDataService)
  private i18n = inject(TranslateService)
  private config = inject<TableGridAdapterOptions<NpcTableRecord>>(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<NpcTableRecord> = inject(TableGridUtils)
  private service = inject(NpcService)

  public entityID(item: NpcTableRecord): string {
    return item.id
  }

  public entityCategories(item: NpcTableRecord): DataTableCategory[] {
    return null
  }

  public virtualOptions(): VirtualGridOptions<NpcTableRecord> {
    return NpcGridCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<NpcTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    const result = buildCommonGatherableGridOptions(this.utils)
    console.log(result)
    return result

  }

  public connect() {
    return this.source$
  }

  private source$: Observable<NpcTableRecord[]> = selectStream(
    {
      items: this.config?.source || this.service.groups$,
    },
    ({ items }) => {
      const filter = this.config?.filter
      if (filter) {
        items = items.filter(filter)
      }
      const sort = this.config?.sort
      if (sort) {
        items = [...items].sort(sort)
      } else {
        items = sortBy(items, (it) => it.groupId)
      }
      return items
    }
  )
}

export function buildCommonGatherableGridOptions(util: TableGridUtils<NpcTableRecord>) {
  const result: GridOptions<NpcTableRecord> = {
    columnDefs: [
      npcColIcon(util),
      npcColId(util),
      npcColName(util),
      npcColTitle(util),
    ],
  }
  // addGenericColumns(result, {
  //   props: COLS_GATHERABLES,
  // })
  return result
}
