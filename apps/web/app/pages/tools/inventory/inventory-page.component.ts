import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { EQUIP_SLOTS, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { filter, firstValueFrom, take } from 'rxjs'
import { GearsetsStore, ItemInstanceRow, ItemInstancesStore } from '~/data'
import { NwModule } from '~/nw'
import { DataGridModule } from '~/ui/data-grid'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data-view'
import { IconsModule } from '~/ui/icons'
import { svgImage, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { VirtualGridModule } from '~/ui/virtual-grid'
import { observeRouteParam } from '~/utils'
import { InventoryTableAdapter, InventoryTableRecord } from '~/widgets/data/inventory-table'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearImporterDialogComponent } from './gear-importer-dialog.component'
import { GearsetFormComponent } from './gearset-form.component'
import { InventoryPickerService } from './inventory-picker.service'

@Component({
  standalone: true,
  selector: 'nwb-inventory-page',
  templateUrl: './inventory-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    GearsetFormComponent,
    IconsModule,
    IonicModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: InventoryTableAdapter,
    }),
    QuicksearchService,
    InventoryPickerService,
    ItemInstancesStore,
    GearsetsStore,
  ],
})
export class InventoryPageComponent implements OnInit {
  protected title = 'Inventory Items'
  protected defaultRoute = 'table'
  protected selectionParam = 'id'
  protected persistKey = 'inventory-table'

  protected svgPlus = svgPlus
  protected svgTrash = svgTrashCan
  protected svgImage = svgImage

  protected categoryId$ = observeRouteParam(this.route, '')
  public constructor(
    private sets: GearsetsStore,
    private items: ItemInstancesStore,
    private picker: InventoryPickerService,
    private dialog: Dialog,
    private route: ActivatedRoute,
    protected service: DataViewService<InventoryTableRecord>
  ) {
    //
  }

  public async ngOnInit() {
    this.items.loadAll()
    this.sets.loadAll()
  }

  protected async createItem() {
    this.picker
      .pickItem({
        multiple: true,
        category: await firstValueFrom(this.service.category$),
      })
      .pipe(take(1))
      .subscribe((items) => {
        for (const item of items) {
          this.items.createRecord({
            record: {
              id: null,
              itemId: getItemId(item),
              gearScore: getItemMaxGearScore(item),
              perks: {},
            },
          })
        }
      })
  }

  protected isScanSupported(category: string) {
    const slot = EQUIP_SLOTS.find((it) => it.itemType === category)
    if (!slot) {
      return false
    }
    if (slot.itemType.startsWith('Equippable') || slot.itemType === 'Weapon' || slot.itemType === 'Shield') {
      return true
    }
    return false
  }

  protected async scanItem(category: string) {
    const slot = EQUIP_SLOTS.find((it) => it.itemType === category)
    if (!slot) {
      return
    }
    GearImporterDialogComponent.open(this.dialog, {
      data: slot.id,
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((instance) => {
        this.items.createRecord({
          record: {
            id: null,
            ...instance,
          },
        })
      })
  }

  protected deleteItem(item: ItemInstanceRow) {
    this.items.destroyRecord({ recordId: item.record.id })
  }
}
