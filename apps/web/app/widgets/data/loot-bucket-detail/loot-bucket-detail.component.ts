import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailModule } from '../item-detail'
import { LootBucketDetailStore } from './loot-bucket-detail.store'

@Component({
  selector: 'nwb-loot-bucket-detail',
  templateUrl: './loot-bucket-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, ItemDetailModule, RouterModule],
  providers: [LootBucketDetailStore],
  host: {
    class: 'block',
  },
})
export class LootBucketDetailComponent {
  public readonly store = inject(LootBucketDetailStore)

  @Input()
  public set bucket(value: string) {
    this.store.load({ bucketId: value })
  }

  @Input()
  public set row(value: number) {
    this.store.selectRow(value)
  }

  public lootTables = this.store.tables
  public lootTableCount = this.store.tablesCount

  protected bucketName = computed(() => {
    return this.store.rows()?.[0]?.LootBucket
  })
}
