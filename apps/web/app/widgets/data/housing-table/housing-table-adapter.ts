import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getUIHousingCategoryLabel } from '@nw-data/common'
import { COLS_HOUSINGITEMS, COLS_HOUSINGITEMSMTX, Housingitems } from '@nw-data/generated'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import {
  DATA_TABLE_SOURCE_OPTIONS,
  DataGridAdapter,
  DataTableCategory,
  DataTableUtils,
  addGenericColumns,
} from '~/ui/data-grid'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
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

@Injectable()
export class HousingTableAdapter implements DataGridAdapter<HousingTableRecord>, DataViewAdapter<HousingTableRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<HousingTableRecord> = inject(DataTableUtils)

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
    return (this.config?.source || this.db.housingItems).pipe(map((items) => items.filter((it) => !it.ExcludeFromGame)))
  }
}

export function buildCommonHousingGridOptions(util: DataTableUtils<HousingTableRecord>) {
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

export function buildPickerHousingGridOptions(utils: DataTableUtils<HousingTableRecord>) {
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
