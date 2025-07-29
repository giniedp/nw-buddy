import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject, input } from '@angular/core'
import { EquipSlot, getEquipSlotForId } from '@nw-data/common'
import { DyeColorData } from '@nw-data/generated'
import { filter, map } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgEye, svgEyeSlash } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { getTransmogCategory } from '~/widgets/data/transmog'
import { TransmogTableAdapter, provideTransmogCellOptions } from '~/widgets/data/transmog-table'
import { DyePickerComponent } from '~/widgets/model-viewer/dye-picker.component'
import { TransmogEditorStore } from './transmog-editor.store'
import { TransmogSlot, TransmogSlotId } from '~/data/transmogs'

@Component({
  selector: 'nwb-transmog-editor-panel',
  templateUrl: './transmog-editor-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'flex flex-col gap-2',
  },
  providers: [
    provideTransmogCellOptions({
      navigate: false,
      tooltips: true,
    }),
  ],
})
export class TransmogEditorPanelComponent {
  private db = injectNwData()
  private store = inject(TransmogEditorStore)
  private modal = inject(ModalService)
  private injector = inject(Injector)
  protected iconEye = svgEye
  protected iconEyeSlash = svgEyeSlash

  public disabled = input(false)
  protected isMale = computed(() => this.store.gender() === 'male')
  protected isDebug = computed(() => this.store.debug())
  protected slots = computed(() => {
    const slotIds: TransmogSlotId[] = ['head', 'chest', 'hands', 'legs', 'feet']
    return slotIds.map((id) => {
      switch (id) {
        case 'head': {
          const slot = getEquipSlotForId('head')
          const transmogId = this.store.head.item()
          const appearance = this.store.headAppearance()
          const dye = this.store.headDye()
          return {
            id,
            dye: dye,
            slot: slot,
            transmogId,
            appearance: appearance,
            debug: this.store.debug(),
            hideChannel: null,
            hideValue: this.store.head.flag(),
          }
        }
        case 'chest': {
          const slot = getEquipSlotForId('chest')
          const transmogId = this.store.chest.item()
          const appearance = this.store.chestAppearance()
          const dye = this.store.chestDye()
          return {
            id,
            dye: dye,
            slot: slot,
            transmogId,
            appearance: appearance,
            debug: this.store.debug(),
            hideChannel: 'all',
            hideValue: this.store.chest.flag(),
          }
        }
        case 'hands': {
          const slot = getEquipSlotForId('hands')
          const transmogId = this.store.hands.item()
          const appearance = this.store.handsAppearance()
          const dye = this.store.handsDye()
          return {
            id,
            dye: dye,
            slot: slot,
            transmogId,
            appearance: appearance,
            debug: this.store.debug(),
            hideChannel: 'main',
            hideValue: this.store.hands.flag(),
          }
        }
        case 'legs': {
          const slot = getEquipSlotForId('legs')
          const transmogId = this.store.legs.item()
          const appearance = this.store.legsAppearance()
          const dye = this.store.legsDye()
          return {
            id,
            dye: dye,
            slot: slot,
            transmogId,
            appearance: appearance,
            debug: this.store.debug(),
            hideChannel: 'main',
            hideValue: this.store.legs.flag(),
          }
        }
        case 'feet': {
          const slot = getEquipSlotForId('feet')
          const transmogId = this.store.feet.item()
          const appearance = this.store.feetAppearance()
          const dye = this.store.feetDye()
          return {
            id,
            dye: dye,
            slot: slot,
            transmogId,
            appearance: appearance,
            debug: this.store.debug(),
            hideChannel: 'main',
            hideValue: this.store.feet.flag(),
          }
        }
      }
      return null
    })
  })

  protected pickSlotGear(slot: EquipSlot) {
    DataViewPicker.from({
      title: 'Select Item',
      injector: this.injector,
      displayMode: ['grid'],
      selection: [this.store[slot.id].item()],
      dataView: {
        adapter: TransmogTableAdapter,
        filter: (item) => {
          return getTransmogCategory(item.category)?.itemClass?.includes(slot.itemType as any)
        },
      },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((list) => list[0]),
      )
      .subscribe((transmogName) => {
        this.store.updateSlot(slot.id as TransmogSlotId, {
          item: transmogName,
        })
      })
  }

  protected async pickSlotDye(slot: EquipSlot, channel: keyof TransmogSlot, selection: DyeColorData) {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: await this.db.dyeColorsAll(),
        color: selection,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        this.store.updateSlot(slot.id as TransmogSlotId, {
          [channel]: value?.Index,
        })
      })
  }

  protected clearSlotColors(slot: EquipSlot) {
    this.store.updateSlot(slot.id as TransmogSlotId, {
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
    })
  }
  protected clearColors() {
    this.store.update({
      head: {
        dyeR: null,
        dyeG: null,
        dyeB: null,
        dyeA: null,
      },
      chest: {
        dyeR: null,
        dyeG: null,
        dyeB: null,
        dyeA: null,
      },
      hands: {
        dyeR: null,
        dyeG: null,
        dyeB: null,
        dyeA: null,
      },
      legs: {
        dyeR: null,
        dyeG: null,
        dyeB: null,
        dyeA: null,
      },
      feet: {
        dyeR: null,
        dyeG: null,
        dyeB: null,
        dyeA: null,
      },
    })
  }

  protected toggleDebug() {
    this.store.update({
      debug: !this.store.debug(),
    })
  }

  protected toggleGender() {
    this.store.update({
      gender: this.store.gender() === 'male' ? 'female' : 'male',
    })
  }

  protected toggleHide(slot: EquipSlot) {
    const slotId: TransmogSlotId = slot.id as any
    const hidden = this.store[slotId]().flag
    this.store.updateSlot(slotId, {
      flag: toggleBit(Number(hidden) || 0, 1),
    })
  }

  protected toggleHide1(slot: EquipSlot) {
    const slotId: TransmogSlotId = slot.id as any
    const hidden = this.store[slotId]().flag
    this.store.updateSlot(slotId, {
      flag: toggleBit(Number(hidden) || 0, 1),
    })
  }

  protected toggleHide2(slot: EquipSlot) {
    const slotId: TransmogSlotId = slot.id as any
    const hidden = this.store[slotId]().flag
    this.store.updateSlot(slotId, {
      flag: toggleBit(Number(hidden) || 0, 2),
    })
  }

  protected isBitSet(value: number | boolean, bit: 1 | 2) {
    return (Number(value) & bit) === bit
  }
}

function toggleBit(value: number, bit: 1 | 2) {
  return Math.min(value ^ bit, 3)
}
