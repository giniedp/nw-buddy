import { EventEmitter, Injectable, inject } from "@angular/core";
import { LootGraphStore } from "./loot-graph.store";
import { patchState } from "@ngrx/signals";
import { testLootContextTag } from "@nw-data/common";

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

  public get showChance() {
    return this.store.showChance()
  }

  public get tagsEditable() {
    return this.store.tagsEditable()
  }

  public isTagInContext(tag: string, value?: string | number | [number] | [number, number]) {
    const context = this.store.context()
    return testLootContextTag({
      contextTags: context.tags,
      contextValues: context.values,
      tag: tag,
      tagValue: value
    })
  }
}
