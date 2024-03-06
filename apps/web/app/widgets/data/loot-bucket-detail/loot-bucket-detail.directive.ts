import { Directive, inject, Input } from '@angular/core'
import { LootBucketDetailStore } from './loot-bucket-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbLootBucketDetail]',
  exportAs: 'bucketDetail',
  providers: [LootBucketDetailStore],
})
export class LootBucketDetailDirective {
  public readonly store = inject(LootBucketDetailStore)

  @Input()
  public set nwbLootBucketDetail(value: string) {
    this.store.patchState({ bucketId: value })
  }

  @Input()
  public set selectedRow(value: number) {
    this.store.patchState({ selectedRow: value })
  }

  public lootTables$ = this.store.lootTables$
}
