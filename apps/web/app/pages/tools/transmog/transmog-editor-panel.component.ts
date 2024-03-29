import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { EquipSlot, getEquipSlotForId } from '@nw-data/common'
import { Dyecolors } from '@nw-data/generated'
import { filter, firstValueFrom, map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { ModalService } from '~/ui/layout'
import { getTransmogCategory } from '~/widgets/data/transmog'
import { TransmogTableAdapter, provideTransmogCellOptions } from '~/widgets/data/transmog-table'
import { DyePickerComponent } from '~/widgets/model-viewer/dye-picker.component'
import { TransmogEditorStore, TransmogSlotName } from './transmog-editor-page.store'
import { ItemFrameModule } from '~/ui/item-frame'
import { svgEye, svgEyeSlash } from '~/ui/icons/svg'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-transmog-editor-panel',
  templateUrl: './transmog-editor-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'block',
  },
  providers: [
    provideTransmogCellOptions({
      navigate: false,
    }),
  ]
})
export class TransmogEditorPanelComponent {
  private store = inject(TransmogEditorStore)
  private modal = inject(ModalService)
  private db = inject(NwDataService)
  private injector = inject(Injector)
  protected iconEye = svgEye
  protected iconEyeSlash = svgEyeSlash

  protected isMale = computed(() => this.store.gender() === 'male')
  protected slots = computed(() => {
    const slotIds: TransmogSlotName[] = ['head', 'chest', 'hands', 'legs', 'feet']
    return slotIds.map((id) => {
      switch (id) {
        case 'head':{
          const slot = getEquipSlotForId('head')
          const transmogId = this.store.head.t()
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
            hideValue: this.store.head.h(),
          }
        }
        case 'chest':{
          const slot = getEquipSlotForId('chest')
          const transmogId = this.store.chest.t()
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
            hideValue: this.store.chest.h(),
          }
        }
        case 'hands':{
          const slot = getEquipSlotForId('hands')
          const transmogId = this.store.hands.t()
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
            hideValue: this.store.hands.h(),
          }
        }
        case 'legs':{
          const slot = getEquipSlotForId('legs')
          const transmogId = this.store.legs.t()
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
            hideValue: this.store.legs.h(),
          }
        }
        case 'feet':{
          const slot = getEquipSlotForId('feet')
          const transmogId = this.store.feet.t()
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
            hideValue: this.store.feet.h(),
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
      selection: [this.store[slot.id].t()],
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
        patchState(this.store, (state) => {
          return {
            [slot.id]: {
              ...state[slot.id],
              t: transmogName,
            },
          }
        })
      })
  }

  protected async pickSlotDye(slot: EquipSlot, channel: 'r' | 'g' | 'b' | 'a', selection: Dyecolors) {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: await firstValueFrom(this.db.dyeColors) ,
        color: selection,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => {
        patchState(this.store, (state) => {
          return {
            [slot.id]: {
              ...state[slot.id],
              [channel]: value?.Index,
            },
          }
        })
      })
  }

  protected clearSlotColors(slot: EquipSlot){
    patchState(this.store, (state) => {
      return {
        [slot.id]: {
          ...state[slot.id],
          r: null,
          g: null,
          b: null,
          a: null,
        },
      }
    })
  }
  protected clearColors() {
    patchState(this.store, (state) => {
      return {
        head: {
          ...state.head,
          r: null,
          g: null,
          b: null,
          a: null,
        },
        chest: {
          ...state.chest,
          r: null,
          g: null,
          b: null,
          a: null,
        },
        hands: {
          ...state.hands,
          r: null,
          g: null,
          b: null,
          a: null,
        },
        legs: {
          ...state.legs,
          r: null,
          g: null,
          b: null,
          a: null,
        },
        feet: {
          ...state.feet,
          r: null,
          g: null,
          b: null,
          a: null,
        },
      }
    })
  }

  protected toggleDebug(){
    patchState(this.store, (state) => {
      return {
        debug: !state.debug,
      }
    })
  }

  protected toggleGender(){
    patchState(this.store, (state) => {
      return {
        gender: ((state.gender === 'male') ? 'female' : 'male') as any
      }
    })
  }

  protected toggleHide(slot: EquipSlot){
    patchState(this.store, (state) => {
      return {
        [slot.id]: {
          ...state[slot.id],
          h: !state[slot.id].h,
        },
      }
    })
  }

  protected toggleHide1(slot: EquipSlot){
    patchState(this.store, (state) => {
      return {
        [slot.id]: {
          ...state[slot.id],
          h: toggleBit(Number(state[slot.id].h) || 0, 1),
        },
      }
    })
  }

  protected toggleHide2(slot: EquipSlot){
    patchState(this.store, (state) => {
      return {
        [slot.id]: {
          ...state[slot.id],
          h: toggleBit(Number(state[slot.id].h) || 0, 2),
        },
      }
    })
  }

  protected isBitSet(value: number | boolean, bit: 1 | 2) {
    return (Number(value) & bit) === bit
  }
}

function toggleBit(value: number, bit: 1 | 2) {
  console.log(value.toString(2), bit.toString(2), (value ^ bit).toString(2))
  return Math.min(value ^ bit, 3)
}
