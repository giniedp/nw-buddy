import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_LOOTLIMITS } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  LootLimitGridRecord,
  lootLimitColCountLimit,
  lootLimitColIcon,
  lootLimitColLimitExpiresAfter,
  lootLimitColName,
  lootLimitColTimeBetweenDrops,
} from './loot-limit-grid-cols'

@Injectable()
export class LootLimitGridSource extends DataGridSource<LootLimitGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, { optional: true })
  private utils: DataGridUtils<LootLimitGridRecord> = inject(DataGridUtils)

  public override entityID(item: LootLimitGridRecord): string {
    return item.LootLimitID
  }

  public override entityCategories(item: LootLimitGridRecord): DataGridCategory[] {
    return null
  }

  public override buildOptions(): GridOptions<LootLimitGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      limits: this.db.lootLimits,
    }).pipe(
      map(({ items, housing, limits }) => {
        return limits.map((it): LootLimitGridRecord => {
          return {
            ...it,
            $item: items.get(it.LootLimitID) || housing.get(it.LootLimitID),
          }
        })
      })
    )
  }
}

function buildOptions(util: DataGridUtils<LootLimitGridRecord>) {
  const result: GridOptions<LootLimitGridRecord> = {
    columnDefs: [
      lootLimitColIcon(util),
      lootLimitColName(util),
      lootLimitColCountLimit(util),
      lootLimitColTimeBetweenDrops(util),
      lootLimitColLimitExpiresAfter(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_LOOTLIMITS,
  })
  return result
}
