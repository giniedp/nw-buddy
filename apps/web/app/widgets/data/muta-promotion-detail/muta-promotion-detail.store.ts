import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { BuffBucket, NW_FALLBACK_ICON } from '@nw-data/common'
import { ElementalMutationStaticData, PromotionMutationStaticData, StatusEffectData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest } from 'rxjs'
import { NwDataService } from '~/data'

@Injectable()
export class MutaPromotionDetailStore extends ComponentStore<{ elementId: string, promotionId: string }> {
  public readonly elementId$ = this.select(({ elementId }) => elementId)
  public readonly element$ = this.select(this.db.mutatorElement(this.elementId$), (it) => it)

  public readonly promotionId$ = this.select(({ promotionId }) => promotionId)
  public readonly promotion$ = this.select(this.db.mutatorPromotion(this.promotionId$), (it) => it)

  public readonly icon$ = this.select(this.promotion$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.promotion$, (it) => it?.Name)

  public readonly statusEffects$ = this.select(
    combineLatest({
      promotion: this.promotion$,
      element: this.element$,
      buffMap: this.db.buffBucketsMap,
      effectMap: this.db.statusEffectsMap,
    }),
    ({ promotion, element, buffMap, effectMap }) => {
      return selectStatusEffects(promotion, element, buffMap, effectMap)
    }
  )

  public constructor(private db: NwDataService) {
    super({ promotionId: null, elementId: null })
  }

  public load(idOrItem: string | PromotionMutationStaticData) {
    if (typeof idOrItem === 'string') {
      this.patchState({ promotionId: idOrItem })
    } else {
      this.patchState({ promotionId: idOrItem?.PromotionMutationId })
    }
  }
}

function selectStatusEffects(
  promotion: PromotionMutationStaticData,
  element: ElementalMutationStaticData,
  buffMap: Map<string, BuffBucket>,
  effectMap: Map<string, StatusEffectData>
) {
  const promotions: string[] = []
  const tags: Array<keyof ElementalMutationStaticData> = ['Dungeon-', 'Dungeon', 'Dungeon+', 'DungeonBoss', 'DungeonMiniBoss']
  for (const tag of tags) {
    promotions.push(
      ...collectPromotions(buffMap.get(element[tag] as string), buffMap)
    )
  }
  return uniq(promotions).map((it) => {
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
  }).filter((it) => !!it)
}

function collectPromotions(bucket: BuffBucket, bucketMap: Map<string, BuffBucket>, result: string[] = []): string[] {
  if (!bucket) {
    return result
  }
  for (const buff of bucket.Buffs) {
    if (buff.BuffType === 'BuffBucket') {
      const bucket = bucketMap.get(buff.Buff)
      collectPromotions(bucket, bucketMap, result)
      continue
    }
    if (buff.BuffType === 'Promotion') {
      result.push(buff.Buff)
      continue
    }
  }
  return result
}
