import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NwDataService } from '~/data'
import {
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridAdapterOptions,
  TableGridUtils,
} from '~/ui/data/table-grid'

import { DataTableCategory } from '~/ui/data/table-grid'

import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { TRANSMOG_CATEGORIES, isAppearanceInTransmogCategory } from '../transmog/transmog-categories'
import { TransmogService } from '../transmog/transmog.service'
import { TransmogCellComponent } from './transmog-cell.component'
import { TransmogRecord } from './types'
import { withRepeat } from '~/utils'

@Injectable()
export class TransmogTableAdapter implements TableGridAdapter<TransmogRecord>, DataViewAdapter<TransmogRecord> {
  private db = inject(NwDataService)
  private service = inject(TransmogService)
  private i18n = inject(TranslateService)
  private config: TableGridAdapterOptions<TransmogRecord> = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<TransmogRecord> = inject(TableGridUtils)

  public entityID(item: TransmogRecord): string {
    return item.id
  }

  public entityCategories(record: TransmogRecord): DataTableCategory[] {
    return TRANSMOG_CATEGORIES.filter((it) => isAppearanceInTransmogCategory(record.appearance, it)).map((it) => ({
      id: it.id,
      label: it.name,
      icon: '',
    }))
  }

  public getCategories(): DataTableCategory[] {
    return TRANSMOG_CATEGORIES.map((it) => {
      return {
        id: it.id,
        label: it.name,
        icon: '',
      }
    })
  }

  public virtualOptions(): VirtualGridOptions<TransmogRecord> {
    return TransmogCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<TransmogRecord> {
    return null
  }

  public connect() {
    return this.source$
  }

  private source$ = this.service.transmogItems$.pipe(
    withRepeat(this.i18n.locale.value$),
    map((list) => {
      if (this.config?.filter) {
        list = list.filter(this.config.filter)
      } else {
        list = list.filter((it) => !!it.category && !!it.subcategory)
      }
      if (this.config.sort) {
        list = [...list].sort(this.config.sort)
      } else {
        list = [...list].sort((a, b) => {
          if (a.category !== b.category) {
            const ia = TRANSMOG_CATEGORIES.findIndex((it) => it.id === a.category)
            const ib = TRANSMOG_CATEGORIES.findIndex((it) => it.id === b.category)
            return ia - ib
          }
          if (a.subcategory !== b.subcategory) {
            const cateogry = TRANSMOG_CATEGORIES.find((it) => it.id === a.category)
            const ia = cateogry.subcategories.findIndex((it) => it === a.subcategory)
            const ib = cateogry.subcategories.findIndex((it) => it === b.subcategory)
            return ia - ib
          }
          const aName = a.appearance.Name || ''
          const bName = b.appearance.Name || ''
          return this.i18n.get(aName)?.localeCompare(this.i18n.get(bName))
        })
      }
      return list
    })
  )
}
