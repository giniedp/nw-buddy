import { signalStore, withState } from '@ngrx/signals'
import { PerkBucket, resolvePerkBucketPerksForItem } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'

export interface PerkBucketDetailState {
  perkBucketId: string
  perkBucket: PerkBucket
  perkData: PerkData[]
}

export const PerkBucketDetailStore = signalStore(
  withState<PerkBucketDetailState>({
    perkBucketId: null,
    perkBucket: null,
    perkData: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load({ perkBucketId, itemId }: { perkBucketId: string; itemId: string }) {
        const perkBucket = await db.perkBucketsById(perkBucketId)
        const item$ = db.itemsById(itemId)
        const perksMap$ = db.perksByIdMap()
        return {
          perkBucketId,
          perkBucket,
          perkData: resolvePerkBucketPerksForItem(perkBucket, await perksMap$, await item$),
        }
      },
    }
  }),
)
