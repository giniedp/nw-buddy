import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { getItemId } from '@nw-data/common'
import { injectNwData } from '~/data'

import { DataTableCategory } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { sortBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { MusicCellComponent } from './music-cell.component'
import { MusicRecord } from './types'

@Injectable()
export class RecipesTableAdapter implements DataViewAdapter<MusicRecord> {
  private db = injectNwData()
  private tl8 = inject(TranslateService)

  public entityID(item: MusicRecord): string {
    return getItemId(item).toLowerCase()
  }

  public entityCategories(record: MusicRecord): DataTableCategory[] {
    return [
      {
        id: (record.TradingGroup || 'Music').toLowerCase(),
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

  private source$ = defer(() => {
    return combineLatest({
      locale: this.tl8.locale.value$,
      items: this.db.itemsByIdTradingFamily('MusicSheets'),
    })
  }).pipe(
    map(({ items }) => {
      return sortBy(items, (it) => this.tl8.get(it.Name))
    }),
  )
}
