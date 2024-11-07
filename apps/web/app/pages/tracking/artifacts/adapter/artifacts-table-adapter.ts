import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { getItemId, isItemArtifact } from '@nw-data/common'
import { injectNwData } from '~/data'

import { DataTableCategory } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { sortBy } from 'lodash'
import { combineLatest, defer, map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { ArtifactCellComponent } from './artifacts-cell.component'
import { ArtifactRecord } from './types'

@Injectable()
export class ArtifactsTableAdapter implements DataViewAdapter<ArtifactRecord> {
  private db = injectNwData()
  private tl8 = inject(TranslateService)

  public entityID(item: ArtifactRecord): string {
    return getItemId(item).toLowerCase()
  }

  public entityCategories(record: ArtifactRecord): DataTableCategory[] {
    return [
      {
        id: record.ItemType.toLowerCase(),
        label: record.ItemType,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<ArtifactRecord> {
    return ArtifactCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<ArtifactRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = defer(() => {
    return combineLatest({
      locale: this.tl8.locale.value$,
      items: this.db.itemsAll(),
    })
  }).pipe(
    map(({ items }) => {
      return sortBy(items.filter(isItemArtifact), (it) => this.tl8.get(it.Name))
    }),
  )
}
