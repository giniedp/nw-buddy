import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getSeasonPassDataId } from '@nw-data/common'
import { COLS_SEASONPASSRANKDATA } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import {
  SeasonPassTableRecord,
  seasonPassColFreeItem,
  seasonPassColID,
  seasonPassColLevel,
  seasonPassColPremiumItem,
  seasonPassColSeason,
} from './season-pass-table-cols'

@Injectable()
export class SeasonPassTableAdapter implements DataViewAdapter<SeasonPassTableRecord> {
  private db = inject(NwDataService)
  private config = injectDataViewAdapterOptions<SeasonPassTableRecord>({ optional: true })
  private utils: TableGridUtils<SeasonPassTableRecord> = inject(TableGridUtils)

  public entityID(item: SeasonPassTableRecord): string {
    return getSeasonPassDataId(item)
  }

  public entityCategories(item: SeasonPassTableRecord): DataTableCategory[] {
    const source = item['$source']
    if (!source) {
      return null
    }
    return [
      {
        id: source,
        label: humanize(source),
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<SeasonPassTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<SeasonPassTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      data: this.db.seasonPassData,
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
      rewardsMap: this.db.seasonPassRewardsMap,
    }).pipe(
      map(({ data, itemsMap, housingMap, rewardsMap }) => {
        return data.map((it) => {
          const freeReward = rewardsMap.get(it.FreeRewardId)
          const premiumReward = rewardsMap.get(it.PremiumRewardId)
          const freeItemId = freeReward?.ItemId || freeReward?.DisplayItemId
          const premiumItemId = premiumReward?.ItemId || premiumReward?.DisplayItemId
          return {
            ...it,
            $source: it['$source'] as string,
            $freeItem: itemsMap.get(freeItemId) || housingMap.get(freeItemId),
            $premiumItem: itemsMap.get(premiumItemId) || housingMap.get(premiumItemId),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<SeasonPassTableRecord>) {
  const result: GridOptions<SeasonPassTableRecord> = {
    columnDefs: [
      seasonPassColID(util),
      seasonPassColSeason(util),
      seasonPassColLevel(util),
      seasonPassColFreeItem(util),
      seasonPassColPremiumItem(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_SEASONPASSRANKDATA,
  })
  return result
}
