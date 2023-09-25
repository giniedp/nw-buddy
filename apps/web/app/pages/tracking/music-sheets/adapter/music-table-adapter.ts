import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { ItemDefinitionMaster } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { mapFilter, selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { MusicCellComponent } from './music-cell.component'
import { MusicRecord } from './types'

@Injectable()
export class RecipesTableAdapter implements TableGridAdapter<MusicRecord>, DataViewAdapter<MusicRecord> {
  private db = inject(NwDbService)

  public entityID(item: MusicRecord): string {
    return getItemId(item)
  }

  public entityCategories(record: MusicRecord): DataTableCategory[] {
    return [
      {
        id: record.TradingGroup || 'Music',
        label: record.TradingGroup,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<MusicRecord> {
    return MusicCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<MusicRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(this.db.items.pipe(mapFilter(isMusicSheet)))
}

function isMusicSheet(item: ItemDefinitionMaster) {
  return item.TradingFamily === 'MusicSheets'
}
