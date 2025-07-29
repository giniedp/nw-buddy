import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { EQUIP_SLOTS } from '@nw-data/common'
import { uniqBy } from 'lodash'
import { Observable, filter } from 'rxjs'
import { ItemInstanceRow, ItemsService } from '~/data'
import { DataViewAdapter, DataViewCategory, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { ConfirmDialogComponent, ModalService } from '~/ui/layout'
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
  inventoryColSync,
  inventoryColTier,
} from './inventory-table-cols'

@Injectable()
export class InventoryTableAdapter implements DataViewAdapter<InventoryTableRecord> {
  private config = injectDataViewAdapterOptions<InventoryTableRecord>({ optional: true })
  private utils: TableGridUtils<InventoryTableRecord> = inject(TableGridUtils)

  private store = inject(ItemsService)
  private dnd = inject(DnDService)
  private modal = inject(ModalService)

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
        modal: this.modal,
        store: this.store,
      })
    }
    options.getRowId = ({ data }) => this.entityID(data)
    return options
  }

  public connect() {
    return this.source$
  }

  private readonly source$: Observable<ItemInstanceRow[]> = this.config?.source || this.store.observeRows()
}

export function buildCommonInventoryGridOptions(
  util: TableGridUtils<InventoryTableRecord>,
  options: {
    dnd: DnDService
    store: ItemsService
    modal: ModalService
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
      options.store.isSignedIn() ? inventoryColSync(util) : null,
      inventoryColActions(util, {
        destroyAction: (e: Event, data: InventoryTableRecord) => {
          e.stopImmediatePropagation()
          util.zone.run(() => {
            ConfirmDialogComponent.open(options.modal, {
              inputs: {
                title: 'Delete Item',
                body: 'Are you sure you want to delete this item? Gearsets linking to this item will loose the reference.',
                positive: 'Delete',
                negative: 'Cancel',
              },
            })
              .result$.pipe(filter((it) => !!it))
              .subscribe(() => {
                options.store.delete(data.record.id)
              })
          })
        },
      }),
    ].filter((it) => !!it),
  }

  return result
}
