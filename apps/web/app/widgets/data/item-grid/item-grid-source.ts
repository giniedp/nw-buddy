import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemPerkBucketIds, getItemPerks, getItemTypeLabel } from '@nw-data/common'
import { COLS_ITEMDEFINITIONMASTER } from '@nw-data/generated'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { ItemPreferencesService } from '~/preferences'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'

import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import { selectStream } from '~/utils'
import {
  ItemGridRecord,
  itemColBookmark,
  itemColEvent,
  itemColGearScore,
  itemColIcon,
  itemColItemClass,
  itemColItemId,
  itemColItemType,
  itemColName,
  itemColOwnedWithGS,
  itemColPerks,
  itemColPrice,
  itemColRarity,
  itemColSource,
  itemColStockCount,
  itemColTier,
  itemColTradingCategory,
  itemColTradingFamily,
  itemColTradingGroup,
} from './item-grid-cols'

@Injectable()
export class ItemGridSource extends DataGridSource<ItemGridRecord> {
  private db = inject(NwDbService)
  private itemPref = inject(ItemPreferencesService)
  private i18n = inject(TranslateService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<ItemGridRecord> = inject(DataGridUtils)

  public override entityID(item: ItemGridRecord): string {
    return item.ItemID
  }

  public override entityCategories(item: ItemGridRecord): DataGridCategory[] {
    if (!item.ItemType) {
      return null
    }
    return [
      {
        id: item.ItemType,
        label: this.i18n.get(getItemTypeLabel(item.ItemType)),
        icon: '',
      },
    ]
  }

  public override buildOptions(): GridOptions<ItemGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils, this.itemPref)
  }

  public connect() {
    return selectStream(
      {
        items: this.config?.source || this.db.items,
        perks: this.db.perksMap,
      },
      ({ items, perks }) => {
        return items.map((it): ItemGridRecord => {
          return {
            ...it,
            $perks: getItemPerks(it, perks),
            $perkBuckets: getItemPerkBucketIds(it),
          }
        })
      }
    )
  }
}

function buildOptions(util: DataGridUtils<ItemGridRecord>, prefs: ItemPreferencesService) {
  const result: GridOptions<ItemGridRecord> = {
    columnDefs: [
      itemColIcon(util),
      itemColName(util),
      // colDefPin(util),
      itemColItemId(util),
      itemColPerks(util),
      itemColRarity(util),
      itemColTier(util),
      itemColBookmark(util, prefs),
      itemColStockCount(util, prefs),
      itemColOwnedWithGS(util, prefs),
      itemColPrice(util, prefs),
      itemColGearScore(util),
      itemColSource(util),
      itemColEvent(util),
      itemColItemType(util),
      itemColItemClass(util),
      itemColTradingGroup(util),
      itemColTradingFamily(util),
      itemColTradingCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ITEMDEFINITIONMASTER,
  })
  return result
}
