import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'

export interface SplitFrameState {
  cid?: string
  minSize?: number
  gutterSize?: number
  horizontal?: boolean
  draggingGutter?: number
}

@Injectable()
export class SplitFrameStore extends ComponentStore<SplitFrameState> {
  public constructor() {
    super({
      cid: '',
      minSize: 0,
      gutterSize: 8,
      horizontal: false,
    })
  }
}
