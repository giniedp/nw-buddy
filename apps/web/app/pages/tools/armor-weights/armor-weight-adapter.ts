import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'

import { DataViewAdapter, DataViewCategory, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
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
import { ArmorWeightsStore } from './armor-weights.store'

@Injectable()
export class ArmorWeightTableAdapter implements DataViewAdapter<ArmorWeightTableRecord> {
  public getCategories?: () => DataViewCategory[]

  private store = inject(ArmorWeightsStore)
  private utils: TableGridUtils<ArmorWeightTableRecord> = inject(TableGridUtils)
  private config = injectDataViewAdapterOptions<ArmorWeightTableRecord>({ optional: true })

  public entityID(item: ArmorWeightTableRecord): string {
    return item.id
  }

  public entityCategories(item: ArmorWeightTableRecord): DataTableCategory[] {
    return [
      {
        id: humanize(item.weightClass),
        label: humanize(item.weightClass),
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
