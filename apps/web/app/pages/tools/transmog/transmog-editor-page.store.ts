import { Signal, computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { Dyecolors, Itemappearancedefinitions } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { TransmogItem, TransmogService } from '~/widgets/data/transmog'
import { ModelsService } from '~/widgets/model-viewer'

export type TransmogSlotName = 'head' | 'chest' | 'hands' | 'legs' | 'feet'
export interface TransmogSlotState {
  // transmog item name
  t: string
  // dye color id
  r: number
  // dye color id
  g: number
  // dye color id
  b: number
  // dye color id
  a: number
  // hide naked sking
  h: boolean | 1 | 2 | 3
}

export interface TransmogEditorState extends Record<TransmogSlotName, TransmogSlotState> {
  gender: 'male' | 'female'
  debug: boolean
}

export const TransmogEditorStore = signalStore(
  withState<TransmogEditorState>({
    debug: false,
    gender: 'male',
    head: {
      t: null,
      r: null,
      g: null,
      b: null,
      a: null,
      h: false,
    },
    chest: {
      t: null,
      r: null,
      g: null,
      b: null,
      a: null,
      h: false,
    },
    hands: {
      t: null,
      r: null,
      g: null,
      b: null,
      a: null,
      h: false,
    },
    legs: {
      t: null,
      r: null,
      g: null,
      b: null,
      a: null,
      h: false,
    },
    feet: {
      t: null,
      r: null,
      g: null,
      b: null,
      a: null,
      h: false,
    },
  }),
  withComputed(() => {
    const db = inject(NwDataService)
    const service = inject(TransmogService)
    return {
      dyeColorsMap: toSignal(db.dyeColorsMap, { initialValue: new Map<number, Dyecolors>() }),
      itemAppearancesMap: toSignal(db.itemAppearancesMap, {
        initialValue: new Map<string, Itemappearancedefinitions>(),
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
    function getDyeSettings(ts: TransmogSlotState, appearance: Itemappearancedefinitions) {
      const rDisabled = 1 === Number(appearance?.RDyeSlotDisabled)
      const gDisabled = 1 === Number(appearance?.GDyeSlotDisabled)
      const bDisabled = 1 === Number(appearance?.BDyeSlotDisabled)
      const aDisabled = 1 === Number(appearance?.ADyeSlotDisabled)
      return {
        r: getDye(ts.r),
        g: getDye(ts.g),
        b: getDye(ts.b),
        a: getDye(ts.a),
        rDisabled,
        gDisabled,
        bDisabled,
        aDisabled,
      }
    }

    const headAppearanceId = computed(() => getAppearanceId(head().t))
    const chestAppearanceId = computed(() => getAppearanceId(chest().t))
    const handsAppearanceId = computed(() => getAppearanceId(hands().t))
    const legsAppearanceId = computed(() => getAppearanceId(legs().t))
    const feetAppearanceId = computed(() => getAppearanceId(feet().t))
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
      if (head.h()) {
        list.push('female_naked_head_caucasian', 'male_naked_head_caucasian')
      }
      if (chest.h() === true || (Number(chest.h()) & 1) === 1) {
        list.push('female_naked_chest', 'male_naked_chest')
      }
      if (chest.h() === true || (Number(chest.h()) & 2) === 2) {
        list.push('female_naked_chest_sleeveless', 'male_naked_chest_sleeveless')
      }
      if (hands.h()) {
        list.push('female_naked_forearms', 'male_naked_forearms')
      }
      if (legs.h()) {
        list.push('female_naked_thighs', 'male_naked_thighs')
      }
      if (feet.h()) {
        list.push('female_naked_calves', 'male_naked_calves')
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
    return {
      headModels: toSignal(modelService.byAppearanceId(toObservable(headAppearanceId))),
      chestModels: toSignal(modelService.byAppearanceId(toObservable(chestAppearanceId))),
      handsModels: toSignal(modelService.byAppearanceId(toObservable(handsAppearanceId))),
      legsModels: toSignal(modelService.byAppearanceId(toObservable(legsAppearanceId))),
      feetModels: toSignal(modelService.byAppearanceId(toObservable(feetAppearanceId))),
    }
  }),
  withMethods((state) => {
    return {
      load: (input: Partial<TransmogEditorState>) => {
        if (!input) {
          return
        }
        patchState(state, {
          head: {
            t: input.head?.t,
            r: input.head?.r,
            g: input.head?.g,
            b: input.head?.b,
            a: input.head?.a,
            h: !!input.head?.h,
          },
          chest: {
            t: input.chest?.t,
            r: input.chest?.r,
            g: input.chest?.g,
            b: input.chest?.b,
            a: input.chest?.a,
            h: input.chest?.h,
          },
          hands: {
            t: input.hands?.t,
            r: input.hands?.r,
            g: input.hands?.g,
            b: input.hands?.b,
            a: input.hands?.a,
            h: !!input.hands?.h,
          },
          legs: {
            t: input.legs?.t,
            r: input.legs?.r,
            g: input.legs?.g,
            b: input.legs?.b,
            a: input.legs?.a,
            h: !!input.legs?.h,
          },
          feet: {
            t: input.feet?.t,
            r: input.feet?.r,
            g: input.feet?.g,
            b: input.feet?.b,
            a: input.feet?.a,
            h: !!input.feet?.h,
          },
        })
      },
    }
  }),
)
