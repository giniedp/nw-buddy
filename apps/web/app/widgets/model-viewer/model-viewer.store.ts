import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemModelInfo } from './model-viewer.service'
import { Dyecolors, Itemappearancedefinitions } from '@nw-data/generated'

export interface ModelViewerState {
  models: ItemModelInfo[]
  index: number
  isLoading: boolean
  hasLoaded: boolean
  hasError: boolean
  canClose: boolean
  enableDye: boolean
  isSupported: boolean
  appearance: Itemappearancedefinitions
  dyeColors: Dyecolors[]
  dyeR: Dyecolors
  dyeG: Dyecolors
  dyeB: Dyecolors
  dyeA: Dyecolors
  dyeDebug: boolean
  mode: 'light' | 'dark'
}

@Injectable()
export class ModelViewerStore extends ComponentStore<ModelViewerState> {
  public readonly mode$ = this.selectSignal(({ mode }) => mode)
  public readonly isSupported$ = this.selectSignal(({ isSupported }) => isSupported)
  public readonly isLoading$ = this.selectSignal(({ isLoading }) => isLoading)
  public readonly isEmpty$ = this.selectSignal(({ models }) => !models?.length)
  public readonly hasLoaded$ = this.selectSignal(({ hasLoaded }) => hasLoaded)
  public readonly hasError$ = this.selectSignal(({ hasError }) => hasError)
  public readonly canClose$ = this.selectSignal(({ canClose }) => canClose)
  public readonly canDye$ = this.selectSignal(({ enableDye, appearance }) => enableDye && !!appearance)
  public readonly dyeColors$ = this.selectSignal(({ dyeColors }) => dyeColors)
  public readonly dyeR$ = this.selectSignal(({ dyeR }) => dyeR)
  public readonly dyeG$ = this.selectSignal(({ dyeG }) => dyeG)
  public readonly dyeB$ = this.selectSignal(({ dyeB }) => dyeB)
  public readonly dyeA$ = this.selectSignal(({ dyeA }) => dyeA)
  public readonly dyeDebug$ = this.selectSignal(({ dyeDebug }) => dyeDebug)
  public readonly dyeRDisabled$ = this.selectSignal(({ enableDye, appearance }) => {
    return !enableDye ? true : Number(appearance.RDyeSlotDisabled) === 1
  })
  public readonly dyeGDisabled$ = this.selectSignal(({ enableDye, appearance }) => {
    return !enableDye ? true : Number(appearance.GDyeSlotDisabled) === 1
  })
  public readonly dyeBDisabled$ = this.selectSignal(({ enableDye, appearance }) => {
    return !enableDye ? true : Number(appearance.BDyeSlotDisabled) === 1
  })
  public readonly dyeADisabled$ = this.selectSignal(({ enableDye, appearance }) => {
    return !enableDye ? true : Number(appearance.ADyeSlotDisabled) === 1
  })

  public readonly buttons$ = this.selectSignal(({ models, index }) => {
    if (!models || models.length <= 1) {
      return []
    }
    return models.map((it, i) => {
      return {
        index: i,
        label: it.label,
        active: i === index,
      }
    })
  })
  public readonly model$ = this.select(({ models, index }) => {
    return models?.[index] || models?.[0]
  })

  public constructor() {
    super({
      models: [],
      index: 0,
      isSupported: false,
      isLoading: false,
      hasLoaded: false,
      hasError: false,
      canClose: false,
      enableDye: false,
      appearance: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
      dyeColors: [],
      dyeDebug: false,
      mode: 'dark',
    })
  }
}
