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

@Component({
  standalone: true,
  selector: 'nwb-transmog-editor-panel',
  templateUrl: './transmog-editor-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule],
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
            debug: this.store.debug()
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
            debug: this.store.debug()
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
            debug: this.store.debug()
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
            debug: this.store.debug()
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
}
