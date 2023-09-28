import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getUIHousingCategoryLabel } from '@nw-data/common'
import { COLS_HOUSINGITEMS, COLS_HOUSINGITEMSMTX, Housingitems } from '@nw-data/generated'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import {
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  DataTableCategory,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  HousingTableRecord,
  housingColHousingTag1Placed,
  housingColHousingTags,
  housingColHowToObtain,
  housingColID,
  housingColIcon,
  housingColName,
  housingColRarity,
  housingColTier,
  housingColUiHousingCategory,
  housingColUserBookmark,
  housingColUserPrice,
  housingColUserStockValue,
} from './housing-table-cols'
import { HousingCellComponent } from './housing-cell.component'
import { selectStream } from '~/utils'

@Injectable()
export class HousingTableAdapter implements TableGridAdapter<HousingTableRecord>, DataViewAdapter<HousingTableRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<HousingTableRecord> = inject(TableGridUtils)

  public entityID(item: HousingTableRecord): string {
    return item.HouseItemID
  }

  public entityCategories(item: HousingTableRecord): DataTableCategory[] {
    if (!item.UIHousingCategory) {
      return null
    }
    return [
      {
        id: item.UIHousingCategory,
        label: this.i18n.get(getUIHousingCategoryLabel(item.UIHousingCategory)),
        icon: '',
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<Housingitems> {
    return HousingCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<HousingTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonHousingGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(this.config?.source || this.db.housingItems, (items) => {
    const filter = this.config?.filter
    items = items.filter((it) => {
      if (it.ExcludeFromGame) {
        return false
      }
      if (filter && !filter(it)) {
        return false
      }
      return true
    })
    const sort = this.config?.sort
    if (sort) {
      items = [...items].sort(sort)
    }
    return items
  })
}

export function buildCommonHousingGridOptions(util: TableGridUtils<HousingTableRecord>) {
  const result: GridOptions<HousingTableRecord> = {
    columnDefs: [
      housingColIcon(util),
      housingColName(util),
      housingColID(util),
      housingColRarity(util),
      housingColTier(util),
      housingColUserBookmark(util),
      housingColUserStockValue(util),
      housingColUserPrice(util),
      housingColHousingTag1Placed(util),
      housingColUiHousingCategory(util),
      housingColHowToObtain(util),
      housingColHousingTags(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_HOUSINGITEMS,
  })
  addGenericColumns(result, {
    props: COLS_HOUSINGITEMSMTX,
  })
  return result
}

export function buildPickerHousingGridOptions(utils: TableGridUtils<HousingTableRecord>) {
  const result: GridOptions<HousingTableRecord> = {
    columnDefs: [
      housingColID(utils),
      housingColIcon(utils),
      housingColName(utils),
      housingColRarity(utils),
      housingColTier(utils),
      housingColUserBookmark(utils),
    ],
  }
  addGenericColumns(result, {
    props: COLS_HOUSINGITEMS,
  })
  addGenericColumns(result, {
    props: COLS_HOUSINGITEMSMTX,
  })
  return result
}
