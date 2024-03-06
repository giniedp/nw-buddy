import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { LootBucketDetailStore } from './loot-bucket-detail.store'
import { ItemFrameModule } from '~/ui/item-frame'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { selectSignal } from '~/utils'
import { ItemDetailModule } from '../item-detail'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
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
    this.store.patchState({ bucketId: value })
  }

  @Input()
  public set row(value: number) {
    this.store.patchState({ selectedRow: value })
  }

  public lootTables$ = this.store.lootTables$

  protected bucketName = selectSignal(this.store.rows$, (rows) => {
    return rows?.[0]?.LootBucket
  })

  protected icon = NW_FALLBACK_ICON
  protected rows = selectSignal(this.store.rows$, (rows) => rows || [])
  protected rowCount = selectSignal(this.store.rows$, (rows) => rows?.length || 0)
  protected selectedRow = selectSignal(this.store.selectedRow$)
  public lootTables = selectSignal(this.store.lootTables$)
  public lootTableCount = selectSignal(this.lootTables, (it) => it?.length || 0)
}
