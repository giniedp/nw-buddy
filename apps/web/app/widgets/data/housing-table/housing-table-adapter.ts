import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getUIHousingCategoryLabel } from '@nw-data/common'
import { COLS_HOUSEITEMS, HouseItems } from '@nw-data/generated'
import { defer } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { HousingCellComponent } from './housing-cell.component'
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

@Injectable()
export class HousingTableAdapter implements DataViewAdapter<HousingTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<HousingTableRecord>({ optional: true })
  private utils: TableGridUtils<HousingTableRecord> = inject(TableGridUtils)

  public entityID(item: HousingTableRecord): string {
    return item.HouseItemID.toLocaleLowerCase()
  }

  public entityCategories(item: HousingTableRecord): DataTableCategory[] {
    if (!item.UIHousingCategory) {
      return null
    }
    return [
      {
        id: item.UIHousingCategory.toLocaleLowerCase(),
        label: this.i18n.get(getUIHousingCategoryLabel(item.UIHousingCategory)),
        icon: '',
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<HouseItems> {
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

  private source$ = selectStream(this.config?.source || defer(() => this.db.housingItemsAll()), (items) => {
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
    props: COLS_HOUSEITEMS,
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
    props: COLS_HOUSEITEMS,
  })
  return result
}
