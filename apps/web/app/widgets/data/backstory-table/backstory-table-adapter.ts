import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import {
  BackstoryItemInstance,
  getBackstoryInventoryItems,
  getItemPerkBucketKeys,
  getItemPerkKeys,
  isMasterItem,
} from '@nw-data/common'
import { COLS_BACKSTORYDATA, Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { DataViewAdapter } from '~/ui/data/data-view'
import {
  DataTableCategory,
  TABLE_GRID_ADAPTER_OPTIONS,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { BackstoryCellComponent } from './backstory-cell.component'
import {
  BackstoryTableRecord,
  backstoryColID,
  backstoryColInventory,
  backstoryColLevel,
  backstoryColName,
  backstoryColTerritories,
  backstoryColType,
} from './backstory-table-cols'

@Injectable()
export class BackstoryTableAdapter
  implements DataViewAdapter<BackstoryTableRecord>, TableGridAdapter<BackstoryTableRecord>
{
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<BackstoryTableRecord> = inject(TableGridUtils)

  public entityID(item: BackstoryTableRecord): string {
    return item.BackstoryID
  }

  public entityCategories(item: BackstoryTableRecord): DataTableCategory[] {
    if (!item.PlaytestType) {
      return null
    }
    return [
      {
        id: item.PlaytestType,
        label: item.PlaytestType,
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<BackstoryTableRecord> {
    return BackstoryCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<BackstoryTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return combineLatest({
      records: this.db.backstories,
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
      territoriesMap: this.db.territoriesMap,
    }).pipe(
      map(({ records, itemsMap, housingMap, territoriesMap }) => {
        return records.map((record): BackstoryTableRecord => {
          return {
            ...record,
            $inventoryItems: getBackstoryInventoryItems(record).map((it) => {
              return selectInventoryItem(it, itemsMap.get(it.itemId) || housingMap.get(it.itemId))
            }),
            $respawnTerritories: (record.RespawnPointTerritories || [])
              .map((it) => {
                return territoriesMap.get(Number(it))
              })
              .filter((it) => !!it),
          }
        })
      }),
    )
  }
}

function buildOptions(util: TableGridUtils<BackstoryTableRecord>) {
  const result: GridOptions<BackstoryTableRecord> = {
    columnDefs: [
      backstoryColID(util),
      backstoryColName(util),
      backstoryColLevel(util),
      backstoryColType(util),
      backstoryColTerritories(util),
      backstoryColInventory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_BACKSTORYDATA,
  })
  return result
}

function selectInventoryItem(record: BackstoryItemInstance, item: ItemDefinitionMaster | Housingitems) {
  if (isMasterItem(item) && record.perks?.length) {
    console.log({
      keys: getItemPerkKeys(item),
      keys2: getItemPerkBucketKeys(item),
      perks: record.perks,
    })
  }
  return {
    item: item,
    itemId: record.itemId,
    gearScore: record.gearScore,
    quantity: record.quantity,
    perks: {},
  }
}
