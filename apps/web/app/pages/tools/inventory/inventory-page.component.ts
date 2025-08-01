import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { EQUIP_SLOTS, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { filter, firstValueFrom, map, take } from 'rxjs'
import { ItemInstanceRow, ItemsService } from '~/data'
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
  injectChildRouteParam,
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
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'

@Component({
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
    SplitPaneDirective,
    SplitGutterComponent,
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
  protected isChildActive = toSignal(injectChildRouteParam('id').pipe(map((it) => !!it)))
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  protected svgPlus = svgPlus
  protected svgTrash = svgTrashCan
  protected svgImage = svgImage
  private store = inject(ItemsService)

  protected categoryId$ = observeRouteParam(this.route, '')
  public constructor(
    private picker: InventoryPickerService,
    private modal: ModalService,
    private route: ActivatedRoute,
    protected service: DataViewService<InventoryTableRecord>,
  ) {
    service.setMode(['table'])
  }

  public async ngOnInit() {
    this.service.loadCategory(this.category$)
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
          this.store.create({
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
        this.store.create({
          id: null,
          ...instance,
        })
      })
  }

  protected deleteItem(item: ItemInstanceRow) {
    this.store.delete(item.record.id)
  }
}
