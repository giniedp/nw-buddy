import { GridOptions } from '@ag-grid-community/core'
import { Dialog } from '@angular/cdk/dialog'
import { Injectable, NgZone, Optional, inject } from '@angular/core'
import { EQUIP_SLOTS } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { Observable, defer, filter, take } from 'rxjs'
import { ItemInstanceRow, ItemInstancesStore } from '~/data'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
import { augmentWithTransactions } from '~/ui/ag-grid'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableCategory, DataTableUtils } from '~/ui/data-grid'
import { DataViewAdapter, DataViewCategory } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'
import { DnDService } from '~/utils/services/dnd.service'
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
  implements DataGridAdapter<InventoryTableRecord>, DataViewAdapter<InventoryTableRecord>
{
  private db = inject(NwDbService)
  private i18n = inject(TranslateService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<InventoryTableRecord> = inject(DataTableUtils)

  public onEntityCreate: Observable<ItemInstanceRow> = this.store?.rowCreated$
  public onEntityUpdate: Observable<ItemInstanceRow> = this.store?.rowUpdated$
  public onEntityDestroy: Observable<string> = this.store?.rowDestroyed$

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

  public virtualOptions(): VirtualGridOptions<InventoryTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<InventoryTableRecord> {
    let options: GridOptions<InventoryTableRecord> = {}
    if (this.config?.gridOptions) {
      options = this.config.gridOptions(this.utils)
    } else {
      options = buildCommonInventoryGridOptions(this.utils, this.dnd)
    }
    // if (this.store) {
    //   augmentWithTransactions(options, {
    //     onCreate: this.store.rowCreated$,
    //     onDestroy: this.store.rowDestroyed$,
    //     onUpdate: this.store.rowUpdated$,
    //   })
    // }
    return options
  }

  public connect() {
    return this.source$
  }

  private readonly source$: Observable<ItemInstanceRow[]> = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))

  public getCategories() {
    const result = EQUIP_SLOTS.filter((it) => it.itemType !== 'Trophies').map(
      (it): DataViewCategory => ({
        icon: it.iconSlot || it.icon,
        id: it.itemType,
        label: it.name,
      })
    )
    return uniqBy(result, (it) => it.id)
  }

  public constructor(
    @Optional()
    private store: ItemInstancesStore,
    private dnd: DnDService,
    private dialog: Dialog,
    private zone: NgZone
  ) {
    this.attachListener()
  }

  private attachListener() {
    // TODO:
    // this.store?.rowCreated$
    //   .pipe(debounceTime(100))
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe((item) => {
    //     this.select.next([item.record.id])
    //   })
  }
}

export function buildCommonInventoryGridOptions(util: DataTableUtils<InventoryTableRecord>, dnd: DnDService) {
  const result: GridOptions<InventoryTableRecord> = {
    columnDefs: [
      inventoryColIcon(util, dnd),
      inventoryColName(util),
      inventoryColPerks(util),
      inventoryColRarity(util),
      inventoryColTier(util),
      inventoryColGearScore(util),
      inventoryColAttributeMods(util),
      inventoryColItemType(util),
      inventoryColItemClass(util),
      inventoryColActions(util),
    ],
  }

  return result
}
