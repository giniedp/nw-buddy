import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getItemRarity } from '@nw-data/common'
import { groupBy } from 'lodash'
import { Observable, combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { DataTableCategory } from '~/ui/data/table-grid'
import { findSets } from '../utils'
import {
  ArmorsetGridRecord,
  armorsetColItem,
  armorsetColItemTrack,
  armorsetColName,
  armorsetColPerks,
  armorsetColTier,
  armorsetColWeight,
} from './armorset-grid-cols'

@Injectable()
export class ArmorsetGridSource extends TableGridAdapter<ArmorsetGridRecord> {
  private db = inject(NwDbService)
  private utils: TableGridUtils<ArmorsetGridRecord> = inject(TableGridUtils)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public override entityID(item: ArmorsetGridRecord): string {
    return item.key
  }

  public override entityCategories(item: ArmorsetGridRecord): DataTableCategory[] {
    return [
      {
        id: item.source,
        label: item.source,
        icon: '',
      },
    ]
  }

  public override gridOptions(): GridOptions<ArmorsetGridRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils)
  }

  public override connect(): Observable<ArmorsetGridRecord[]> {
    return combineLatest({
      items: this.db.items,
      perks: this.db.perksMap,
    }).pipe(
      map(({ items, perks }) => {
        const MIN_RARITY = 2
        items = items.filter((it) => it.ItemType === 'Armor').filter((it) => getItemRarity(it) >= MIN_RARITY)
        return Object.entries(groupBy(items, (it) => it['$source']))
          .map(([key, items]) => ({
            key: key,
            sets: findSets(items, key, perks, this.utils.i18n),
          }))
          .filter((group) => group.sets.length > 0)
          .map((it) => it.sets)
          .flat(1)
          .map((it) => it.sets)
          .flat(1)
      })
    )
  }
}

function buildOptions(util: TableGridUtils<ArmorsetGridRecord>) {
  const result: GridOptions<ArmorsetGridRecord> = {
    columnDefs: [
      armorsetColName(util),
      armorsetColTier(util),
      armorsetColWeight(util),
      armorsetColPerks(util),
      ...Array.from({ length: 5 })
        .map((_, i) => {
          return [armorsetColItem(util, i), armorsetColItemTrack(util, i)]
        })
        .flat(1),
    ],
  }
  console.log(result)
  return result
}
