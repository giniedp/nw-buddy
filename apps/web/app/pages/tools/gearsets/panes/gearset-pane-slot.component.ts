import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { Overlay } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter, take } from 'rxjs'

import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { EquipSlotId, NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { GearsetRecord, ItemInstance, GearsetSlotStore } from '~/data'
import { GsSliderComponent } from '~/ui/gs-input'
import { IconsModule } from '~/ui/icons'
import {
  svgEllipsisVertical,
  svgImage,
  svgLink16p,
  svgLinkSlash16p,
  svgPlus,
  svgRotate,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { GearImporterDialogComponent } from '../../inventory/gear-importer-dialog.component'
import { InventoryPickerService } from '../../inventory/inventory-picker.service'

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-slot',
  templateUrl: './gearset-pane-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    ItemDetailModule,
    IconsModule,
    LayoutModule,
    TooltipModule,
    ItemFrameModule,
    GsSliderComponent,
  ],
  providers: [GearsetSlotStore],
  host: {
    class: 'block bg-black rounded-md flex flex-col overflow-hidden',
    '[class.hidden]': 'isHidden()',
    '[class.screenshot-hidden]': 'isScreenshotHidden()',
  },
})
export class GearsetPaneSlotComponent {
  public readonly slotId = input<EquipSlotId>()
  public readonly gearset = input<GearsetRecord>()

  @Output()
  public itemRemove = new EventEmitter<void>()

  @Output()
  public itemUnlink = new EventEmitter<ItemInstance>()

  @Output()
  public itemInstantiate = new EventEmitter<ItemInstance>()

  @Input()
  public compact: boolean

  @Input()
  public square: boolean

  @Input()
  public disabled: boolean

  protected store = inject(GearsetSlotStore)

  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconPlus = svgPlus
  protected iconChange = svgRotate
  protected iconMenu = svgEllipsisVertical
  protected iconImage = svgImage
  protected gsScrollStrat = this.overlay.scrollStrategies.close({
    threshold: 10,
  })

  protected isGearSlot = computed(() => {
    return this.store.isArmor() || this.store.isWeapon() || this.store.isJewelry() || this.store.isRune()
  })
  protected isEquipmentSlot = computed(() => {
    return !this.isGearSlot()
  })

  protected isHidden = computed(() => {
    return !this.store.hasItem() || this.disabled
  })
  protected isScreenshotHidden = computed(() => {
    return !this.store.hasItem()
  })

  protected gsValue: number
  protected gsTarget: Element

  public constructor(
    private picker: InventoryPickerService,
    private dialog: Dialog,
    private overlay: Overlay,
  ) {
    this.store.connectState(
      selectSignal({
        gearset: this.gearset,
        slotId: this.slotId,
      }),
    )
  }

  protected openGsEditor(event: MouseEvent) {
    this.gsTarget = event.currentTarget as Element
  }
  protected closeGsEditor() {
    this.gsTarget = null
    if (this.gsValue) {
      this.store.updateSlotGearScore(this.store.slotId(), this.gsValue)
    }
  }

  protected updateGearScore(value: number) {
    this.gsValue = value
  }

  protected stepGearScore(event: WheelEvent) {
    if (event.deltaY < 0) {
      this.gsValue += 1
    }
    if (event.deltaY > 0) {
      this.gsValue -= 1
    }
    this.gsValue = Math.max(NW_MIN_GEAR_SCORE, Math.min(NW_MAX_GEAR_SCORE, this.gsValue))
  }

  protected async handlePickItem() {
    const slot = this.store.slot()
    const instance = this.store.instance()
    if (slot.itemType === 'Trophies') {
      this.picker
        .pickHousingItem({
          title: 'Select a trophy',
          selection: instance ? [instance.itemId] : [],
          category: slot.itemType,
        })
        .pipe(take(1))
        .subscribe(([item]) => {
          this.store.patchSlot(slot.id, {
            itemId: getItemId(item),
            gearScore: null,
            perks: {},
          })
        })
    } else {
      this.picker
        .pickItem({
          title: 'Select an item',
          selection: instance ? [instance.itemId] : [],
          categories: [slot.itemType],
          noSkins: true,
        })
        .pipe(take(1))
        .subscribe(([item]) => {
          this.store.patchSlot(slot.id, {
            itemId: getItemId(item),
            gearScore: getItemMaxGearScore(item),
            perks: {},
          })
        })
    }
  }

  protected async handleScanItem() {
    const slotId = this.slotId()
    GearImporterDialogComponent.open(this.dialog, {
      data: slotId,
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((instance) => {
        this.store.patchSlot(slotId, instance)
      })
  }

  protected handlePickPerk(key: string) {
    const instance = this.store.instance()
    this.picker
      .pickPerkForItem(instance, key)
      .pipe(take(1))
      .subscribe((perk) => {
        this.store.updateSlotPerk(this.store.slotId(), key, perk)
      })
  }

  protected async handleLinkItem() {
    this.picker
      .pickInstance({
        title: 'Pick item',
        category: this.store.slot().itemType,
        selection: [this.store.instanceId()],
        multiple: false,
      })
      .pipe(take(1))
      .subscribe((it) => {
        this.store.patchSlot(this.store.slotId(), it[0] as string)
      })
  }

  protected async handleUnlink() {
    const instance = this.store.instance()
    this.itemUnlink.next(instance)
  }

  protected handleUnequip() {
    this.itemRemove.next()
  }

  protected async instantiate() {
    const instance = this.store.instance()
    this.itemInstantiate.next(instance)
  }
}
