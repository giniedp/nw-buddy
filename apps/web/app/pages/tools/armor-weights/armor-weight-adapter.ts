import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { DataTableCategory, TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'

import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import {
  ArmorWeightTableRecord,
  armorWeightColChest,
  armorWeightColFeet,
  armorWeightColHands,
  armorWeightColHead,
  armorWeightColLegs,
  armorWeightColRating,
  armorWeightColShield,
  armorWeightColWeight,
} from './armor-weight-cols'
import { ArmorWeightSet, ArmorWeightsStore } from './armor-weights.store'
import { humanize } from '~/utils'

@Injectable()
export class ArmorWeightTableAdapter
  implements DataViewAdapter<ArmorWeightTableRecord>, TableGridAdapter<ArmorWeightTableRecord>
{
  public getCategories?: () => DataViewCategory[]
  public onEntityCreate?: Observable<ArmorWeightSet>
  public onEntityUpdate?: Observable<ArmorWeightSet>
  public onEntityDestroy?: Observable<string>

  private store = inject(ArmorWeightsStore)
  private utils: TableGridUtils<ArmorWeightTableRecord> = inject(TableGridUtils)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: ArmorWeightTableRecord): string {
    return item.id
  }

  public entityCategories(item: ArmorWeightTableRecord): DataTableCategory[] {
    return [
      {
        id: humanize(item.weightClass) ,
        label: humanize(item.weightClass) ,
        icon: null,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<ArmorWeightTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<ArmorWeightTableRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils)
  }

  public connect(): Observable<ArmorWeightTableRecord[]> {
    return this.store.allVariations$
  }
}

function buildOptions(util: TableGridUtils<ArmorWeightTableRecord>) {
  const result: GridOptions<ArmorWeightTableRecord> = {
    columnDefs: [
      armorWeightColHead(util),
      armorWeightColChest(util),
      armorWeightColHands(util),
      armorWeightColLegs(util),
      armorWeightColFeet(util),
      armorWeightColShield(util),
      armorWeightColWeight(util),
      armorWeightColRating(util),
    ],
  }
  return result
}
