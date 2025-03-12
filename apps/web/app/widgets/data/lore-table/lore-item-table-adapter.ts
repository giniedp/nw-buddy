import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NW_FALLBACK_ICON, getQuestTypeIcon } from '@nw-data/common'
import { COLS_LOREDATA, LoreData } from '@nw-data/generated'
import { defer, sortBy } from 'lodash'
import { Observable, from, map } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { eqCaseInsensitive, humanize } from '~/utils'
import { LoreItemCellComponent } from './lore-item-cell.component'
import {
  LoreItemTableRecord,
  loreColBody,
  loreColID,
  loreColOrder,
  loreColTitle,
  loreColType,
} from './lore-item-table-cols'

@Injectable()
export class LoreItemTableAdapter implements DataViewAdapter<LoreItemTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<LoreItemTableRecord>({ optional: true })
  private utils: TableGridUtils<LoreItemTableRecord> = inject(TableGridUtils)

  public entityID(item: LoreItemTableRecord): string | number {
    return item.LoreID.toLowerCase()
  }

  public entityCategories(item: LoreItemTableRecord): DataTableCategory[] {
    if (!item.Type) {
      return null
    }
    return [
      {
        id: item.Type.toLowerCase(),
        label: humanize(item.Type === 'Default' ? 'Page' : item.Type),
        icon: getQuestTypeIcon(item.Type) || NW_FALLBACK_ICON,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<LoreItemTableRecord> {
    return LoreItemCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<LoreItemTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }
  public connect() {
    const source: Observable<LoreData[]> = this.config?.source || from(this.db.loreItemsAll())
    return source.pipe(
      map((list) => {
        return list.map((item): LoreItemTableRecord => {
          return {
            ...item,
            $numChildren: list.filter((i) => eqCaseInsensitive(i.ParentID, item.LoreID)).length,
          }
        })
      }),
      map((list) => {
        return sortBy(list, (item) => buildKey(list, item))
      }),
    )
  }
}

function buildKey(list: LoreItemTableRecord[], item: LoreItemTableRecord) {
  if (!item) {
    return ''
  }
  if (!item.ParentID) {
    let order = item.Order
    let label = item.LoreID
    if (item.Type === 'Default') {
      order = 999
    }
    if (item.Type === 'Chapter') {
      order = 998
    }
    if (item.Type === 'Topic') {
      order = 1
      label = item.Title
      if (!!item.ImagePath) {
        order = 0
      }
      if (!item.$numChildren) {
        order = 99
      }
    }
    return `${String(order || 0).padStart(3, '0')}-${label}`
  }
  const parent = list.find((i) => eqCaseInsensitive(i.LoreID, item.ParentID))
  const parentKey = buildKey(list, parent)
  return `${parentKey}-${String(item.Order).padStart(3, '0')}-${item.LoreID}`
}

function buildOptions(util: TableGridUtils<LoreItemTableRecord>) {
  const result: GridOptions<LoreItemTableRecord> = {
    columnDefs: [loreColID(util), loreColTitle(util), loreColBody(util), loreColType(util), loreColOrder(util)],
  }
  addGenericColumns(result, {
    props: COLS_LOREDATA,
  })
  return result
}
