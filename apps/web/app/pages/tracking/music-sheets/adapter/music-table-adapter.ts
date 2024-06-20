import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { sortBy } from 'lodash'
import { TranslateService } from '~/i18n'
import { MusicCellComponent } from './music-cell.component'
import { MusicRecord } from './types'

@Injectable()
export class RecipesTableAdapter implements TableGridAdapter<MusicRecord>, DataViewAdapter<MusicRecord> {
  private db = inject(NwDataService)
  private tl8 = inject(TranslateService)

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

  private source$ = selectStream({ locale: this.tl8.locale.value$, items: this.db.items }, ({ items }) => {
    return sortBy(items.filter(isMusicSheet), (it) => this.tl8.get(it.Name))
  })
}

function isMusicSheet(item: MasterItemDefinitions) {
  return item.TradingFamily === 'MusicSheets'
}
