import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NwDbService } from '~/nw'
import { TableGridAdapter } from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { TRANSMOG_CATEGORIES, TransmogService, matchTransmogCateogry } from '~/widgets/data/appearance-detail'
import { ArtifactCellComponent } from './transmog-cell.component'
import { TransmogRecord } from './types'

@Injectable()
export class ArtifactsTableAdapter implements TableGridAdapter<TransmogRecord>, DataViewAdapter<TransmogRecord> {
  private db = inject(NwDbService)
  private tmService = inject(TransmogService)

  public entityID(item: TransmogRecord): string {
    return item.id
  }

  public entityCategories(record: TransmogRecord): DataTableCategory[] {
    return TRANSMOG_CATEGORIES.filter((it) => matchTransmogCateogry(it, record.appearance)).map((it) => ({
      id: it.id,
      label: it.name,
      icon: '',
    }))
  }

  public virtualOptions(): VirtualGridOptions<TransmogRecord> {
    return ArtifactCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<TransmogRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = this.tmService.appearances$
}
