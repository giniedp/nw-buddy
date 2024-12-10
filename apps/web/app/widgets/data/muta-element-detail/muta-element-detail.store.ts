import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { BuffBucket, NW_FALLBACK_ICON } from '@nw-data/common'
import { ElementalMutationStaticData, MutationPerksStaticData, StatusEffectData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'

export interface MutaElementDetailState {
  elementId: string
  element: ElementalMutationStaticData
  perkData: MutationPerksStaticData
  effects: Array<{
    icon: string
    label: string
    text: string
    tags: string[]
  }>
}

export const MutaElementDetailStore = signalStore(
  withState<MutaElementDetailState>({
    elementId: null,
    element: null,
    perkData: null,
    effects: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      async load({ elementId }: { elementId: string }) {
        const element = await db.mutatorElementsById(elementId)
        const perkData$ = db.mutatorElementsPerksById(element?.CategoryWildcard)
        const buffMap$ = db.buffBucketsByIdMap()
        const effectMap$ = db.statusEffectsByIdMap()
        return {
          elementId,
          element,
          perkData: await perkData$,
          effects: selectStatusEffects(element, await buffMap$, await effectMap$),
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
  element: ElementalMutationStaticData,
  buffMap: Map<string, BuffBucket>,
  effectMap: Map<string, StatusEffectData>,
) {
  const tagged: Array<{ tag: string; effectId: string }> = []
  const tags: Array<keyof ElementalMutationStaticData> = [
    'Dungeon-',
    'Dungeon',
    'Dungeon+',
    'DungeonBoss',
    'DungeonMiniBoss',
  ]
  for (const tag of tags) {
    for (const effectId of collectEffectIds(buffMap.get(element[tag] as string), buffMap)) {
      tagged.push({ tag, effectId })
    }
  }
  const groups: Record<string, string[]> = {}
  for (const { tag, effectId } of tagged) {
    if (!groups[effectId]) {
      groups[effectId] = []
    }
    if (!groups[effectId].includes(tag)) {
      groups[effectId].push(tag)
    }
  }

  return Object.entries(groups)
    .map(([effect, tags]) => {
      const item = effectMap.get(effect)
      if (!item?.DisplayName) {
        return null
      }
      return {
        effect: item,
        icon: item.PlaceholderIcon || NW_FALLBACK_ICON,
        label: item.DisplayName || item.StatusID,
        text: item.DisplayName ? item.Description || `${item.StatusID}_Tooltip` : null,
        tags: tags,
      }
    })
    .filter((it) => !!it)
}

function* collectEffectIds(
  bucket: BuffBucket,
  bucketMap: Map<string, BuffBucket>,
  result: string[] = [],
): Generator<string> {
  if (!bucket) {
    return
  }
  for (const buff of bucket.Buffs) {
    if (buff.BuffType === 'StatusEffect') {
      yield buff.Buff
      continue
    }
    if (buff.BuffType === 'BuffBucket') {
      const bucket = bucketMap.get(buff.Buff)
      for (const item of collectEffectIds(bucket, bucketMap, result)) {
        yield item
      }
      continue
    }
    if (buff.BuffType === 'Ability') {
      continue
    }
    if (buff.BuffType === 'Promotion') {
      // TODO: resolve promotion
      continue
    }
  }
  return
}
