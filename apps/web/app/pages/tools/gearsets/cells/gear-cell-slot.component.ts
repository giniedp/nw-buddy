import { Overlay } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter, take } from 'rxjs'

import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { EquipSlotId, NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE, getItemId, getItemMaxGearScore } from '@nw-data/common'
import { GearsetRecord, GearsetSlotStore, ItemsService } from '~/data'
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
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { GearImporterDialogComponent } from '../../inventory/gear-importer-dialog.component'
import { InventoryPickerService } from '../../inventory/inventory-picker.service'

@Component({
  selector: 'nwb-gear-cell-slot',
  templateUrl: './gear-cell-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
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
export class GearCellSlotComponent {
  public readonly slotId = input<EquipSlotId>()
  public readonly gearset = input<GearsetRecord>()

  public compact = input(false)
  public square = input(false)
  public disabled = input(false)

  protected store = inject(GearsetSlotStore)
  private items = inject(ItemsService)

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

  protected isPublished = computed(() => this.gearset()?.status === 'public')
  protected isGearSlot = computed(() => {
    return this.store.isArmor() || this.store.isWeapon() || this.store.isJewelry() || this.store.isRune()
  })
  protected isEquipmentSlot = computed(() => {
    return !this.isGearSlot()
  })

  public isHidden = computed(() => {
    return !this.store.hasItem() && this.disabled()
  })
  public isScreenshotHidden = computed(() => {
    return !this.store.hasItem()// || this.disabled()
  })

  protected slotIcon = computed(() => {
    return this.store.item()?.IconPath || this.store.slot()?.icon
  })
  protected slotItemId = computed(() => {
    return this.store.instance()?.itemId
  })
  protected hasItem = computed(() => {
    return !!this.store.item()
  })

  protected gsValue: number
  protected gsTarget: Element

  public constructor(
    private picker: InventoryPickerService,
    private modal: ModalService,
    private overlay: Overlay,
  ) {
    this.store.connect(
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
      this.gsValue = null
    }
  }

  protected updateGearScore(value: number) {
    this.gsValue = Number(value)
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

  protected handleScanItem() {
    const slotId = this.slotId()
    GearImporterDialogComponent.open(this.modal, {
      inputs: { slotId },
    })
      .result$.pipe(filter((it) => !!it))
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
    this.store.updateSlot(this.slotId(), {
      gearScore: instance.gearScore,
      itemId: instance.itemId,
      perks: instance.perks,
    })
  }

  protected handleUnequip() {
    this.store.updateSlot(this.slotId(), null)
  }

  protected async instantiate() {
    const record = this.store.instance()
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Convert to link',
        body: 'This will create a new item in your inventory and link it to the slot.',
        positive: 'Convert',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(async () => {
        const instance = await this.items.create({
          gearScore: record.gearScore,
          itemId: record.itemId,
          perks: record.perks,
        })
        this.store.updateSlot(this.slotId(), instance.id)
      })
  }
}
