import { computed, EventEmitter, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { ArmorAppearanceDefinitions, DyeColorData } from '@nw-data/generated'
import { DeepPartial } from 'chart.js/dist/types/utils'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import { TransmogSlot, TransmogSlotId } from '~/data/transmogs'
import { TransmogItem, TransmogService } from '~/widgets/data/transmog'
import { ModelsService } from '~/widgets/model-viewer'

export interface TransmogEditorState extends Record<TransmogSlotId, TransmogSlot> {
  gender: 'male' | 'female'
  debug: boolean
}

export const TransmogEditorStore = signalStore(
  withState<TransmogEditorState>({
    debug: false,
    gender: 'male',
    head: {
      item: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      flag: 0,
    },
    chest: {
      item: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      flag: 0,
    },
    hands: {
      item: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      flag: 0,
    },
    legs: {
      item: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      flag: 0,
    },
    feet: {
      item: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      flag: 0,
    },
  }),
  withComputed(() => {
    const db = injectNwData()
    const service = inject(TransmogService)
    const dyeColorsMap$ = from<Promise<Map<number, DyeColorData>>>(db.dyeColorsByIndexMap())
    const itemAppearancesMap$ = from<Promise<Map<string, ArmorAppearanceDefinitions>>>(db.armorAppearancesByIdMap())
    return {
      dyeColorsMap: toSignal(dyeColorsMap$, { initialValue: new Map<number, DyeColorData>() }),
      itemAppearancesMap: toSignal(itemAppearancesMap$, {
        initialValue: new Map<string, ArmorAppearanceDefinitions>(),
      }),
      transmogMap: toSignal(service.transmogItemsMap$, { initialValue: new Map<string, TransmogItem>() }),
    }
  }),
  withComputed(({ head, chest, hands, legs, feet, dyeColorsMap, itemAppearancesMap, transmogMap, gender }) => {
    const modelService = inject(ModelsService)
    function getAppearanceId(name: string) {
      const transmog = transmogMap().get(name)
      const male = transmog?.male
      const female = transmog?.female
      return ((gender() === 'female' ? female : male) || male)?.id
    }
    function getDye(id: number) {
      return dyeColorsMap().get(id)
    }
    function getDyeSettings(ts: TransmogSlot, appearance: ArmorAppearanceDefinitions) {
      const rDisabled = 1 === Number(appearance?.RDyeSlotDisabled)
      const gDisabled = 1 === Number(appearance?.GDyeSlotDisabled)
      const bDisabled = 1 === Number(appearance?.BDyeSlotDisabled)
      const aDisabled = 1 === Number(appearance?.ADyeSlotDisabled)
      return {
        r: getDye(ts.dyeR),
        g: getDye(ts.dyeG),
        b: getDye(ts.dyeB),
        a: getDye(ts.dyeA),
        rDisabled,
        gDisabled,
        bDisabled,
        aDisabled,
      }
    }

    const headAppearanceId = computed(() => getAppearanceId(head.item()))
    const chestAppearanceId = computed(() => getAppearanceId(chest.item()))
    const handsAppearanceId = computed(() => getAppearanceId(hands.item()))
    const legsAppearanceId = computed(() => getAppearanceId(legs.item()))
    const feetAppearanceId = computed(() => getAppearanceId(feet.item()))
    const headAppearance = computed(() => itemAppearancesMap().get(headAppearanceId()))
    const chestAppearance = computed(() => itemAppearancesMap().get(chestAppearanceId()))
    const handsAppearance = computed(() => itemAppearancesMap().get(handsAppearanceId()))
    const legsAppearance = computed(() => itemAppearancesMap().get(legsAppearanceId()))
    const feetAppearance = computed(() => itemAppearancesMap().get(feetAppearanceId()))
    const headModels = toSignal(modelService.byAppearanceId(toObservable(headAppearanceId)))
    const chestModels = toSignal(modelService.byAppearanceId(toObservable(chestAppearanceId)))
    const handsModels = toSignal(modelService.byAppearanceId(toObservable(handsAppearanceId)))
    const legsModels = toSignal(modelService.byAppearanceId(toObservable(legsAppearanceId)))
    const feetModels = toSignal(modelService.byAppearanceId(toObservable(feetAppearanceId)))
    const headDye = computed(() => getDyeSettings(head(), headAppearance()))
    const chestDye = computed(() => getDyeSettings(chest(), chestAppearance()))
    const handsDye = computed(() => getDyeSettings(hands(), handsAppearance()))
    const legsDye = computed(() => getDyeSettings(legs(), legsAppearance()))
    const feetDye = computed(() => getDyeSettings(feet(), feetAppearance()))
    const hideNakedMeshes = computed(() => {
      const list: string[] = []
      if (head.flag()) {
        list.push('head1_primitive0')
      }
      if ((Number(chest.flag()) & 1) === 1) {
        list.push('shirt1')
      }
      if ((Number(chest.flag()) & 2) === 2) {
        list.push('shirt2')
      }
      if (hands.flag()) {
        list.push('gloves1')
      }
      if (legs.flag()) {
        list.push('pants1')
      }
      if (feet.flag()) {
        list.push('boots1')
      }
      return list
    })
    return {
      headAppearanceId,
      chestAppearanceId,
      handsAppearanceId,
      legsAppearanceId,
      feetAppearanceId,

      headAppearance,
      chestAppearance,
      handsAppearance,
      legsAppearance,
      feetAppearance,

      headModels,
      chestModels,
      handsModels,
      legsModels,
      feetModels,

      headDye,
      chestDye,
      handsDye,
      legsDye,
      feetDye,

      hideNakedMeshes,
    }
  }),
  withComputed(({ headAppearanceId, chestAppearanceId, handsAppearanceId, legsAppearanceId, feetAppearanceId }) => {
    const modelService = inject(ModelsService)
    const headModels = toSignal(modelService.byAppearanceId(toObservable(headAppearanceId)))
    const chestModels = toSignal(modelService.byAppearanceId(toObservable(chestAppearanceId)))
    const handsModels = toSignal(modelService.byAppearanceId(toObservable(handsAppearanceId)))
    const legsModels = toSignal(modelService.byAppearanceId(toObservable(legsAppearanceId)))
    const feetModels = toSignal(modelService.byAppearanceId(toObservable(feetAppearanceId)))
    return {
      headModel: computed(() => headModels()?.[0]?.url),
      chestModel: computed(() => {
        const models = chestModels() ?? []
        if (handsAppearanceId()) {
          return models[1]?.url ?? models[0]?.url
        }
        return models[0]?.url
      }),
      handsModel: computed(() => handsModels()?.[0]?.url),
      legsModel: computed(() => legsModels()?.[0]?.url),
      feetModel: computed(() => feetModels()?.[0]?.url),
    }
  }),
  withProps(() => {
    return {
      changed: new EventEmitter(),
    }
  }),
  withMethods((state) => {
    return {
      getState: (): TransmogEditorState => {
        return {
          gender: state.gender(),
          debug: state.debug(),
          head: state.head(),
          chest: state.chest(),
          hands: state.hands(),
          legs: state.legs(),
          feet: state.feet(),
        }
      },
      load: (input: Partial<TransmogEditorState>) => {
        if (!input) {
          return
        }
        patchState(state, {
          gender: input.gender || 'male',
          head: {
            item: input.head?.item,
            dyeR: input.head?.dyeR,
            dyeG: input.head?.dyeG,
            dyeB: input.head?.dyeB,
            dyeA: input.head?.dyeA,
            flag: input.head?.flag,
          },
          chest: {
            item: input.chest?.item,
            dyeR: input.chest?.dyeR,
            dyeG: input.chest?.dyeG,
            dyeB: input.chest?.dyeB,
            dyeA: input.chest?.dyeA,
            flag: input.chest?.flag,
          },
          hands: {
            item: input.hands?.item,
            dyeR: input.hands?.dyeR,
            dyeG: input.hands?.dyeG,
            dyeB: input.hands?.dyeB,
            dyeA: input.hands?.dyeA,
            flag: input.hands?.flag,
          },
          legs: {
            item: input.legs?.item,
            dyeR: input.legs?.dyeR,
            dyeG: input.legs?.dyeG,
            dyeB: input.legs?.dyeB,
            dyeA: input.legs?.dyeA,
            flag: input.legs?.flag,
          },
          feet: {
            item: input.feet?.item,
            dyeR: input.feet?.dyeR,
            dyeG: input.feet?.dyeG,
            dyeB: input.feet?.dyeB,
            dyeA: input.feet?.dyeA,
            flag: input.feet?.flag,
          },
        })
      },
      update(update: DeepPartial<TransmogEditorState>) {
        patchState(state, (it) => {
          return {
            ...it,
            ...update,
            head: {
              ...(it.head || {}),
              ...(update.head || ({} as any)),
            },
            chest: {
              ...(it.chest || {}),
              ...(update.chest || ({} as any)),
            },
            hands: {
              ...(it.hands || {}),
              ...(update.hands || ({} as any)),
            },
            legs: {
              ...(it.legs || {}),
              ...(update.legs || ({} as any)),
            },
            feet: {
              ...(it.feet || {}),
              ...(update.feet || ({} as any)),
            },
          }
        })
        state.changed.emit()
      },
    }
  }),
  withMethods(({ update }) => {
    return {
      updateGender(gender: 'male' | 'female') {
        update({
          gender: gender,
        })
      },
      updateSlot(slot: TransmogSlotId, patch: Partial<TransmogSlot>) {
        update({
          [slot]: patch,
        })
      },
    }
  }),
)
