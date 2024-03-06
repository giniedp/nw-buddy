import { inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NwDataService } from '~/data'
import { selectStream } from '~/utils'

export interface LootBucketDetailState {
  bucketId: string
  selectedRow: number
}

export class LootBucketDetailStore extends ComponentStore<LootBucketDetailState> {
  protected db = inject(NwDataService)

  public readonly bucketId$ = this.select((state) => state.bucketId)
  public readonly selectedRow$ = this.select((state) => state.selectedRow)

  public readonly rows$ = selectStream(this.db.lootBucket(this.bucketId$))
  public readonly row$ = selectStream({ rows: this.rows$, row: this.selectedRow$ }, ({ rows, row }) => rows?.find((it) => it.Row === row))

  public readonly lootTables$ = selectStream(this.db.lootTablesByLootBucketId(this.bucketId$))

  public constructor() {
    super({ bucketId: null, selectedRow: null })
  }
}
