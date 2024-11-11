import { Directive, inject, Input } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
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
  public set nwbLootLimitDetail(value: string) {
    this.store.load(value)
  }

  public nwbLootLimitDetailChange = outputFromObservable(toObservable(this.store.lootLimit))
}
