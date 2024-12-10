import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { BuffBucket, NW_FALLBACK_ICON } from '@nw-data/common'
import { ElementalMutationStaticData, PromotionMutationStaticData, StatusEffectData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { injectNwData, withStateLoader } from '~/data'

export interface MutaPromotionDetailState {
  elementId: string
  promotionId: string
  element: ElementalMutationStaticData
  promotion: PromotionMutationStaticData
  effects: Array<{
    icon: string
    label: string
    text: string
    //tags: string[]
  }>
}

export const MutaPromotionDetailStore = signalStore(
  withState<MutaPromotionDetailState>({
    elementId: null,
    promotionId: null,
    element: null,
    promotion: null,
    effects: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load({ elementId, promotionId }: { elementId: string; promotionId: string }) {
        const element = await db.mutatorElementsById(elementId)
        const promotion = await db.mutatorPromotionsById(promotionId)
        const buffMap$ = db.buffBucketsByIdMap()
        const effectMap$ = db.statusEffectsByIdMap()
        return {
          elementId,
          element,
          promotionId,
          promotion,
          effects: selectStatusEffects(promotion, element, await buffMap$, await effectMap$),
        }
      },
    }
  }),
  withComputed(({ element }) => {
    return {
      icon: computed(() => element()?.IconPath || NW_FALLBACK_ICON),
      name: computed(() => element()?.Name),
    }
  }),
)

function selectStatusEffects(
  promotion: PromotionMutationStaticData,
  element: ElementalMutationStaticData,
  buffMap: Map<string, BuffBucket>,
  effectMap: Map<string, StatusEffectData>,
) {
  const promotions: string[] = []
  const tags: Array<keyof ElementalMutationStaticData> = [
    'Dungeon-',
    'Dungeon',
    'Dungeon+',
    'DungeonBoss',
    'DungeonMiniBoss',
  ]
  for (const tag of tags) {
    for (const buff of collectBuffIds(buffMap.get(element[tag] as string), buffMap)) {
      promotions.push(buff)
    }
  }
  return uniq(promotions)
    .map((it) => {
      const effect = effectMap.get(promotion[it])
      if (!effect?.DisplayName) {
        return null
      }
      return {
        effect: effect,
        icon: effect.PlaceholderIcon || NW_FALLBACK_ICON,
        label: effect.DisplayName,
        text: effect.Description || `${effect.StatusID}_Tooltip`,
      }
    })
    .filter((it) => !!it)
}

function* collectBuffIds(bucket: BuffBucket, bucketMap: Map<string, BuffBucket>): Generator<string> {
  if (!bucket) {
    return
  }
  for (const buff of bucket.Buffs) {
    if (buff.BuffType === 'BuffBucket') {
      const bucket = bucketMap.get(buff.Buff)
      for (const item of collectBuffIds(bucket, bucketMap)) {
        yield item
      }
      continue
    }
    if (buff.BuffType === 'Promotion') {
      yield buff.Buff
      continue
    }
  }
}
