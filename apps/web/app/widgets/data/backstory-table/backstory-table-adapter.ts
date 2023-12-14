import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import {
  BackstoryItem,
  buildBackstoryItemInstance,
  buildBackstoryItemPerkOverrides,
  getBackstoryItems,
  getItemMaxGearScore,
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
  InventoryItem,
  backstoryColID,
  backstoryColInventory,
  backstoryColLevel,
  backstoryColName,
  backstoryColTerritories,
  backstoryColType,
} from './backstory-table-cols'
import { tapDebug } from '~/utils'

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
      perksMap: this.db.perksMap,
      bucketsMap: this.db.perkBucketsMap,
    }).pipe(
      map(({ records, itemsMap, housingMap, territoriesMap, perksMap, bucketsMap }) => {
        return records.map((record): BackstoryTableRecord => {
          return {
            ...record,
            $inventoryItems: getBackstoryItems(record).map((it): InventoryItem => {
              const item = itemsMap.get(it.itemId) || housingMap.get(it.itemId)
              const instance = buildBackstoryItemInstance(it, {
                itemsMap,
                housingMap,
                perksMap,
                bucketsMap,
              })
              return {
                ...instance,
                item
              }
            }),
            $respawnTerritories: (record.RespawnPointTerritories || [])
              .map((it) => {
                return territoriesMap.get(Number(it))
              })
              .filter((it) => !!it),
          }
        })
      }),
      tapDebug('backstory-table-adapter'),
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
