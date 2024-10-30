import { EventEmitter, Injectable, inject } from '@angular/core'
import { LootGraphStore } from './loot-graph.store'
import { patchState } from '@ngrx/signals'
import { testLootContextTag } from '@nw-data/common'

@Injectable()
export class LootGraphService {
  private store = inject(LootGraphStore)

  public addTagClicked = new EventEmitter<string>()
  public removeTagClicked = new EventEmitter<string>()

  public set showLocked(value: boolean) {
    patchState(this.store, { showLocked: value })
  }
  public get showLocked() {
    return this.store.showLocked()
  }

  public set showChance(value: boolean) {
    patchState(this.store, { showChance: value })
  }
  public get showChance() {
    return this.store.showChance()
  }

  public set tagsEditable(value: boolean) {
    patchState(this.store, { tagsEditable: value })
  }
  public get tagsEditable() {
    return this.store.tagsEditable()
  }

  public set highlight(value: string) {
    patchState(this.store, { highlight: value })
  }
  public get highlight() {
    return this.store.highlight()
  }

  public set highlightPicker(value: boolean) {
    patchState(this.store, { highlightPicker: value })
  }
  public get highlightPicker() {
    return this.store.highlightPicker()
  }

  public isTagInContext(tag: string, value?: string | number | [number] | [number, number]) {
    const context = this.store.context()
    return testLootContextTag({
      contextTags: context.tags,
      contextValues: context.values,
      tag: tag,
      tagValue: value,
    })
  }
}
