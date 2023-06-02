import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { filter, firstValueFrom, take } from 'rxjs'
import { GearsetsStore, ItemInstanceRow, ItemInstancesStore } from '~/data'
import { NwModule } from '~/nw'
import { EQUIP_SLOTS, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { IconsModule } from '~/ui/icons'
import { svgImage, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetFormComponent } from './gearset-form.component'
import { InventoryPickerService } from './inventory-picker.service'
import { PlayerItemsTableAdapter } from './inventory-table.adapter'
import { GearImporterDialogComponent } from './gear-importer-dialog.component'
import { Dialog } from '@angular/cdk/dialog'
import { observeRouteParam } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-inventory-page',
  templateUrl: './inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    QuicksearchModule,
    DataTableModule,
    NavToolbarModule,
    ScreenshotModule,
    IconsModule,
    GearsetFormComponent,
    TooltipModule,
    IonicModule
  ],
  host: {
    class: 'layout-col',
  },
  providers: [PlayerItemsTableAdapter.provider(), QuicksearchService, InventoryPickerService, ItemInstancesStore, GearsetsStore],
})
export class PlayerItemsPageComponent implements OnInit {
  protected svgPlus = svgPlus
  protected svgTrash = svgTrashCan
  protected svgImage = svgImage

  protected categoryId$ = observeRouteParam(this.route, '')
  public constructor(
    private sets: GearsetsStore,
    private items: ItemInstancesStore,
    private picker: InventoryPickerService,
    private adapter: DataTableAdapter<ItemInstanceRow>,
    private dialog: Dialog,
    private route: ActivatedRoute
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
        category: await firstValueFrom(this.adapter.category),
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
            ...instance
          },
        })
      })
  }

  protected deleteItem(item: ItemInstanceRow) {
    this.items.destroyRecord({ recordId: item.record.id })
  }
}
