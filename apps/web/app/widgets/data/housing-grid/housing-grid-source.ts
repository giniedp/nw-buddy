import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getUIHousingCategoryLabel } from '@nw-data/common'
import { COLS_HOUSINGITEMS, COLS_HOUSINGITEMSMTX } from '@nw-data/generated'
import { map } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'

import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  HousingGridRecord,
  housingColHouseItemId,
  housingColHousingTag1Placed,
  housingColHousingTags,
  housingColHowToObtain,
  housingColIcon,
  housingColName,
  housingColRarity,
  housingColTier,
  housingColUiHousingCategory,
  housingColUserBookmark,
  housingColUserPrice,
  housingColUserStockValue,
} from './housing-grid-cols'

@Injectable()
export class HousingGridSource extends DataGridSource<HousingGridRecord> {
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<HousingGridRecord> = inject(DataGridUtils)

  public override entityID(item: HousingGridRecord): string {
    return item.HouseItemID
  }

  public override entityCategories(item: HousingGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<HousingGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return (this.config?.source || this.db.housingItems).pipe(map((items) => items.filter((it) => !it.ExcludeFromGame)))
  }
}

function buildOptions(util: DataGridUtils<HousingGridRecord>) {
  const result: GridOptions<HousingGridRecord> = {
    columnDefs: [
      housingColIcon(util),
      housingColName(util),
      housingColHouseItemId(util),
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
