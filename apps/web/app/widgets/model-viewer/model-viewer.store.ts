import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemModelInfo } from './model-viewer.service'
import { Itemappearancedefinitions } from '@nw-data/generated'

export interface ModelViewerState {
  models: ItemModelInfo[]
  index: number
  isLoading: boolean
  hasLoaded: boolean
  hasError: boolean
  canClose: boolean
  isSupported: boolean
  appearance: Itemappearancedefinitions
  dyeR: any
  dyeG: any
  dyeB: any
  dyeA: any
}

@Injectable()
export class ModelViewerStore extends ComponentStore<ModelViewerState> {
  public readonly isSupported$ = this.selectSignal(({ isSupported }) => isSupported)
  public readonly isLoading$ = this.selectSignal(({ isLoading }) => isLoading)
  public readonly hasLoaded$ = this.selectSignal(({ hasLoaded }) => hasLoaded)
  public readonly hasError$ = this.selectSignal(({ hasError }) => hasError)
  public readonly canClose$ = this.selectSignal(({ canClose }) => canClose)

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
      appearance: null,
      dyeR: null,
      dyeG: null,
      dyeB: null,
      dyeA: null,
    })
  }
}
