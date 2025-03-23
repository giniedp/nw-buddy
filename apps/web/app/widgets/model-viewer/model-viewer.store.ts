import { computed } from '@angular/core'
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals'
import { ArmorAppearanceDefinitions, DyeColorData, MountData } from '@nw-data/generated'
import { ModelItemInfo } from './model-viewer.service'
import { supportsWebGL } from './utils/webgl-support'
import { injectNwData } from '~/data'
import { environment } from 'apps/web/environments'

export interface ModelViewerState {
  environments: string[]
  environmentIndex: number
  animations: string[]
  animationIndex: number
  models: ModelItemInfo[]
  modelIndex: number
  enableDye: boolean
  isSupported: boolean
  appearance: ArmorAppearanceDefinitions
  dyeColors: DyeColorData[]
  dyeR: DyeColorData
  dyeG: DyeColorData
  dyeB: DyeColorData
  dyeA: DyeColorData
  dyeDebug: boolean
  mode: 'light' | 'dark'
}

export const ModelViewerStore = signalStore(
  withState<ModelViewerState>({
    environments: [
      'https://assets.babylonjs.com/textures/parking.env',
      'auto',
      'https://assets.babylonjs.com/textures/country.env',
      'https://assets.babylonjs.com/textures/environment.env',
      'https://assets.babylonjs.com/textures/night.env',
    ],
    environmentIndex: 0,
    animations: [],
    animationIndex: 0,
    models: [],
    modelIndex: 0,
    enableDye: false,
    isSupported: supportsWebGL(),
    appearance: null,
    dyeColors: [],
    dyeR: null,
    dyeG: null,
    dyeB: null,
    dyeA: null,
    dyeDebug: false,
    mode: 'dark',
  }),
  withProps(({ models, enableDye, appearance, modelIndex, animations, animationIndex, environments, environmentIndex }) => {
    return {
      isEmpty: computed(() => !models()?.length),
      canDye: computed(() => enableDye() && !!appearance()),
      dyeRDisabled: computed(() => !enableDye() || Number(appearance()?.RDyeSlotDisabled) === 1),
      dyeGDisabled: computed(() => !enableDye() || Number(appearance()?.GDyeSlotDisabled) === 1),
      dyeBDisabled: computed(() => !enableDye() || Number(appearance()?.BDyeSlotDisabled) === 1),
      dyeADisabled: computed(() => !enableDye() || Number(appearance()?.ADyeSlotDisabled) === 1),
      model: computed(() => models()?.[modelIndex()] || models()?.[0]),
      buttons: computed(() => {
        if (!models() || models().length <= 1) {
          return []
        }
        return models().map((it, i) => {
          return {
            index: i,
            label: it.label,
            active: i === modelIndex(),
          }
        })
      }),
      animation: computed(() => animations()[animationIndex()]),
      environment: computed(() => environments()[environmentIndex()]),
    }
  }),
  withMethods((state) => {
    const db = injectNwData()

    return {
      setDyeR: (dyeR: DyeColorData) => patchState(state, { dyeR }),
      setDyeG: (dyeG: DyeColorData) => patchState(state, { dyeG }),
      setDyeB: (dyeB: DyeColorData) => patchState(state, { dyeB }),
      setDyeA: (dyeA: DyeColorData) => patchState(state, { dyeA }),
      setDebug: (value: boolean) => patchState(state, { dyeDebug: value }),
      setIndex: (index: number) => patchState(state, { modelIndex: index }),
      toggleMode: () => patchState(state, { mode: state.mode() === 'dark' ? 'light' : 'dark' }),
      setModels: (models: ModelItemInfo[]) => patchState(state, { models }),
      setAnimations: (newAnimations: string[]) => {
        patchState(state, ({ animationIndex, animations }) => {
          return {
            animations: newAnimations,
            animationIndex: findAnimationIndex(animationIndex, animations, newAnimations),
          }
        })
      },
      setAnimationIndex: (index: number) => {
        patchState(state, { animationIndex: index })
      },
      setAnimation: (name: string) => {
        patchState(state, ({ animations }) => {
          const index = animations.indexOf(name)
          return { animationIndex: index >= 0 ? index : 0 }
        })
      },
      setEnvironment: (name: string) => {
        patchState(state, ({ environments }) => {
          const index = environments.indexOf(name)
          return { environmentIndex: index >= 0 ? index : 0 }
        })
      },
      setAppearance: async (appearance: ArmorAppearanceDefinitions) => {
        if (!appearance) {
          patchState(state, {
            appearance: null,
            enableDye: false,
            dyeColors: [],
            dyeR: null,
            dyeG: null,
            dyeB: null,
            dyeA: null,
          })
          return
        }
        const itemType = (appearance as any as MountData).MountId ? 'MountDye' : 'Dye'
        const items = await db
          .itemsByItemTypeMap()
          .then((it) => it.get(itemType))
          .then((it) => it || [])
          .then((list) => list.map((it) => Number(it.ItemID.match(/\d+/)[0])))
        const colors = await db.dyeColorsAll().then((list) => {
          return list.filter((it) => items.includes(it.Index))
        })
        patchState(state, {
          enableDye: !!appearance,
          appearance: appearance,
          dyeColors: colors,
          dyeR: null,
          dyeG: null,
          dyeB: null,
          dyeA: null,
        })
      },
    }
  }),
)

function findAnimationIndex(index: number, oldAnimations: string[], newAnimations: string[]): number {
  const oldName = oldAnimations[index]
  const newIndex = newAnimations.indexOf(oldName)
  if (newIndex >= 0) {
    return newIndex
  }
  const matcher = [/grazing/, /idle/, /loop/]
  for (const match of matcher) {
    const index = newAnimations.findIndex((value) => value.match(match))
    if (index >= 0) {
      return index
    }
  }
  return 0
}
