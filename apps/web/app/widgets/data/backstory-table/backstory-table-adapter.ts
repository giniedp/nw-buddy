import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_BACKSTORYDEFINITION } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectBackstoryItems } from '../backstory-detail/selectors'
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
export class BackstoryTableAdapter implements DataViewAdapter<BackstoryTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<BackstoryTableRecord>({ optional: true })
  private utils: TableGridUtils<BackstoryTableRecord> = inject(TableGridUtils)

  public entityID(item: BackstoryTableRecord): string {
    return item.BackstoryID.toLowerCase()
  }

  public entityCategories(item: BackstoryTableRecord): DataTableCategory[] {
    if (!item.PlaytestType) {
      return null
    }
    return [
      {
        id: item.PlaytestType.toLowerCase(),
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
      records: this.db.backstoriesAll(),
      itemsMap: this.db.itemsByIdMap(),
      housingMap: this.db.housingItemsByIdMap(),
      territoriesMap: this.db.territoriesByIdMap(),
      perksMap: this.db.perksByIdMap(),
      bucketsMap: this.db.perkBucketsByIdMap(),
    }).pipe(
      map(({ records, itemsMap, housingMap, territoriesMap, perksMap, bucketsMap }) => {
        return records.map((record): BackstoryTableRecord => {
          return {
            ...record,
            $inventoryItems: selectBackstoryItems(record, {
              itemsMap,
              housingMap,
              perksMap,
              bucketsMap,
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
    props: COLS_BACKSTORYDEFINITION,
  })
  return result
}
