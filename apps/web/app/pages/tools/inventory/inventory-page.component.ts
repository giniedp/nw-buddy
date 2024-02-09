import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { EQUIP_SLOTS, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { filter, firstValueFrom, map, take } from 'rxjs'
import { InventoryItemsStore, ItemInstanceRow } from '~/data'
import { NwModule } from '~/nw'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgImage, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import {
  eqCaseInsensitive,
  injectBreakpoint,
  injectRouteParam,
  injectUrlParams,
  observeRouteParam,
  selectStream,
} from '~/utils'
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
    IonHeader,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    LayoutModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: InventoryTableAdapter,
    }),
    QuicksearchService,
    InventoryPickerService,
  ],
})
export class InventoryPageComponent implements OnInit {
  protected title = 'Inventory Items'
  protected defaultRoute = 'table'
  protected selectionParam = 'id'
  protected persistKey = 'inventory-table'
  protected category$ = selectStream(injectRouteParam('category'), (it) => {
    return eqCaseInsensitive(it, this.defaultRoute) ? null : it
  })

  protected isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected isChildActive = toSignal(injectUrlParams('/:resource/:category/:id', (it) => !!it?.['id']))
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  protected svgPlus = svgPlus
  protected svgTrash = svgTrashCan
  protected svgImage = svgImage
  private items = inject(InventoryItemsStore)

  protected categoryId$ = observeRouteParam(this.route, '')
  public constructor(
    private picker: InventoryPickerService,
    private modal: ModalService,
    private route: ActivatedRoute,
    protected service: DataViewService<InventoryTableRecord>,
  ) {
    //
  }

  public async ngOnInit() {
    this.service.loadCateory(this.category$)
  }

  protected async createItem() {
    const category = await firstValueFrom(this.service.category$)
    let categories = await firstValueFrom(this.service.categories$.pipe(map((list) => list.map((it) => it.id))))
    if (category) {
      categories = [category]
    }
    this.picker
      .pickItem({
        multiple: true,
        categories: categories,
        noSkins: true,
      })
      .pipe(take(1))
      .subscribe((items) => {
        for (const item of items) {
          this.items.createRecord({
            id: null,
            itemId: getItemId(item),
            gearScore: getItemMaxGearScore(item),
            perks: {},
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
    GearImporterDialogComponent.open(this.modal, {
      inputs: { slotId: slot.id },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe((instance) => {
        this.items.createRecord({
          id: null,
          ...instance,
        })
      })
  }

  protected deleteItem(item: ItemInstanceRow) {
    this.items.destroyRecord(item.record.id)
  }
}
