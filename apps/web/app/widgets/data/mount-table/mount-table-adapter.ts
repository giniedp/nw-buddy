import { GridOptions } from '@ag-grid-community/core'
import { inject, Injectable } from '@angular/core'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { TableGridUtils } from '~/ui/data/table-grid'

import { defer } from 'rxjs'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize, selectStream } from '~/utils'
import { MountCellComponent } from './mount-cell.component'
import { MountTableRecord } from './mount-table-cols'

@Injectable()
export class MountTableAdapter implements DataViewAdapter<MountTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<MountTableRecord>({ optional: true })
  private utils: TableGridUtils<MountTableRecord> = inject(TableGridUtils)

  public entityID(item: MountTableRecord): string {
    return item.MountId.toLowerCase()
  }

  public entityCategories(item: MountTableRecord): DataTableCategory[] {
    if (!item.MountType) {
      return null
    }
    return [
      {
        id: item.MountType.toLowerCase(),
        label: humanize(item.MountType),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<MountTableRecord> {
    return MountCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<MountTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(
    {
      mounts: this.config?.source || defer(() => this.db.mountsAll()),
    },
    ({ mounts }) => {
      const filter = this.config?.filter
      if (filter) {
        mounts = mounts.filter(filter)
      }
      const sort = this.config?.sort
      if (sort) {
        mounts = [...mounts].sort(sort)
      }
      return mounts
    },
  )
}
