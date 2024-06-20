import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { PerkBucket, resolvePerkBucketPerksForItem } from '@nw-data/common'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { shareReplayRefCount } from '~/utils'

export interface PerkBucketDetailState {
  itemId: string
  perkBucketId: string
  fixedPerkIds: string[]
}

@Injectable()
export class PerkBucketDetailStore extends ComponentStore<PerkBucketDetailState> {
  public readonly itemId$ = this.select(({ itemId }) => itemId)
  public readonly bucketId$ = this.select(({ perkBucketId }) => perkBucketId)
  public readonly fixedPerkIds = this.select(({ perkBucketId }) => perkBucketId)
  public readonly bucket$ = combineLatest({
    item: this.db.item(this.itemId$),
    bucket: this.db.perkBucket(this.bucketId$),
    perks: this.db.perksMap,
  })
    .pipe(map(selectBucket))
    .pipe(shareReplayRefCount(1))

  public readonly chance$ = this.select(this.bucket$, (it) => it?.PerkChance)
  public readonly type$ = this.select(this.bucket$, (it) => it?.PerkType)
  public readonly perks$ = this.select(this.bucket$, (it) => it?.Perks)

  public constructor(private db: NwDataService) {
    super({
      itemId: null,
      perkBucketId: null,
      fixedPerkIds: null,
    })
  }

  public readonly togglePerkId = this.updater((state: PerkBucketDetailState, perkId: string) => {
    const perks = [...(state.fixedPerkIds || [])]
    const index = perks.indexOf(perkId)
    if (index >= 0) {
      perks.splice(index, 1)
    } else {
      perks.push(perkId)
    }
    return {
      ...state,
      fixedPerkIds: perks,
    }
  })
}

function selectBucket({
  item,
  bucket,
  perks,
}: {
  item: MasterItemDefinitions
  bucket: PerkBucket
  perks: Map<string, PerkData>
}) {
  if (!bucket) {
    return null
  }

  return {
    ...bucket,
    Perks: resolvePerkBucketPerksForItem(bucket, perks, item),
  }
}
