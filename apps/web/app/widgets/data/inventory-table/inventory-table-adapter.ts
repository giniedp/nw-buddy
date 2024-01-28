import { GridOptions } from '@ag-grid-community/core'
import { Dialog } from '@angular/cdk/dialog'
import { Injectable, Optional, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { EQUIP_SLOTS } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { Observable, filter, take } from 'rxjs'
import { InventoryItemsStore, ItemInstanceRow } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { DataTableCategory, TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ConfirmDialogComponent } from '~/ui/layout'
import { DnDService } from '~/utils/services/dnd.service'
import { InventoryCellComponent } from './inventory-cell.component'
import {
  InventoryTableRecord,
  inventoryColActions,
  inventoryColAttributeMods,
  inventoryColGearScore,
  inventoryColIcon,
  inventoryColItemClass,
  inventoryColItemType,
  inventoryColName,
  inventoryColPerks,
  inventoryColRarity,
  inventoryColTier,
} from './inventory-table-cols'

@Injectable()
export class InventoryTableAdapter
  implements TableGridAdapter<InventoryTableRecord>, DataViewAdapter<InventoryTableRecord>
{
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<InventoryTableRecord> = inject(TableGridUtils)

  public entityID(item: ItemInstanceRow): string {
    return item.record.id
  }

  public entityCategories(item: ItemInstanceRow): DataTableCategory[] {
    if (!item.item.ItemClass?.length) {
      return null
    }
    return item.item.ItemClass.map((id) => {
      return {
        id: id,
        label: id,
        icon: '',
      }
    })
  }

  public getCategories() {
    const result = EQUIP_SLOTS.filter((it) => it.itemType !== 'Trophies').map(
      (it): DataViewCategory => ({
        icon: it.iconSlot || it.icon,
        id: it.itemType,
        label: it.name,
      }),
    )
    return uniqBy(result, (it) => it.id)
  }

  public virtualOptions(): VirtualGridOptions<InventoryTableRecord> {
    return InventoryCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<InventoryTableRecord> {
    let options: GridOptions<InventoryTableRecord> = {}
    if (this.config?.gridOptions) {
      options = this.config.gridOptions(this.utils)
    } else {
      options = buildCommonInventoryGridOptions(this.utils, {
        dnd: this.dnd,
        dialog: this.dialog,
        store: this.store,
      })
    }

    return options
  }

  public connect() {
    return this.source$
  }

  private readonly source$: Observable<ItemInstanceRow[]> = this.config?.source || toObservable(this.store.rows)

  public constructor(
    @Optional()
    private store: InventoryItemsStore,
    private dnd: DnDService,
    private dialog: Dialog,
  ) {
    //
  }
}

export function buildCommonInventoryGridOptions(
  util: TableGridUtils<InventoryTableRecord>,
  options: {
    dnd: DnDService
    store: InventoryItemsStore
    dialog: Dialog
  },
) {
  const result: GridOptions<InventoryTableRecord> = {
    columnDefs: [
      inventoryColIcon(util, options.dnd),
      inventoryColName(util),
      inventoryColPerks(util),
      inventoryColRarity(util),
      inventoryColTier(util),
      inventoryColGearScore(util),
      inventoryColAttributeMods(util),
      inventoryColItemType(util),
      inventoryColItemClass(util),
      inventoryColActions(util, {
        destroyAction: (e: Event, data: InventoryTableRecord) => {
          e.stopImmediatePropagation()
          util.zone.run(() => {
            ConfirmDialogComponent.open(options.dialog, {
              data: {
                title: 'Delete Item',
                body: 'Are you sure you want to delete this item? Gearsets linking to this item will loose the reference.',
                positive: 'Delete',
                negative: 'Cancel',
              },
            })
              .closed.pipe(take(1))
              .pipe(filter((it) => !!it))
              .subscribe(() => {
                options.store.destroyRecord(data.record.id)
              })
          })
        },
      }),
    ],
  }

  return result
}
