import { Directive, inject, Input, Output } from '@angular/core'
import { LootLimitDetailStore } from './loot-limit-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbLootLimitDetail]',
  exportAs: 'limitDetail',
  providers: [LootLimitDetailStore],
})
export class LootLimitDetailDirective {
  public readonly store = inject(LootLimitDetailStore)

  @Input()
  public set nwbGatherableDetail(value: string) {
    this.store.patchState({ limitId: value })
  }

  @Output()
  public nwbLootLimitDetail = this.store.lootLimit$
}
