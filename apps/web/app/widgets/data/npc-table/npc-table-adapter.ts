import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { TableGridUtils } from '~/ui/data/table-grid'

import { sortBy } from 'lodash'
import { Observable } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { NpcService } from '../npc-detail'
import { NpcGridCellComponent } from './npc-cell.component'
import { NpcTableRecord, npcColIcon, npcColId, npcColName, npcColTitle } from './npc-table-cols'

@Injectable()
export class NpcsTableAdapter implements DataViewAdapter<NpcTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<NpcTableRecord>({ optional: true })
  private utils: TableGridUtils<NpcTableRecord> = inject(TableGridUtils)
  private service = inject(NpcService)

  public entityID(item: NpcTableRecord): string {
    return item.npcs[0].id.toLowerCase()
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
        items = sortBy(items, (it) => it.id)
      }
      return items
    },
  )
}

export function buildCommonGatherableGridOptions(util: TableGridUtils<NpcTableRecord>) {
  const result: GridOptions<NpcTableRecord> = {
    columnDefs: [npcColIcon(util), npcColId(util), npcColName(util), npcColTitle(util)],
  }
  // addGenericColumns(result, {
  //   props: COLS_GATHERABLES,
  // })
  return result
}
