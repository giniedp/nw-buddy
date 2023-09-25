import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemId, isItemArtifact } from '@nw-data/common'
import { NwDbService } from '~/nw'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'
import { mapFilter, selectStream } from '~/utils'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { ArtifactCellComponent } from './artifacts-cell.component'
import { ArtifactRecord } from './types'

@Injectable()
export class ArtifactsTableAdapter implements TableGridAdapter<ArtifactRecord>, DataViewAdapter<ArtifactRecord> {
  private db = inject(NwDbService)

  public entityID(item: ArtifactRecord): string {
    return getItemId(item)
  }

  public entityCategories(record: ArtifactRecord): DataTableCategory[] {
    return [
      {
        id: record.ItemType,
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

  private source$ = selectStream(this.db.items.pipe(mapFilter((it) => isItemArtifact(it))))
}
