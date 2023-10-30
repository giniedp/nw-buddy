import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { BuffBucket, NW_FALLBACK_ICON } from '@nw-data/common'
import { Elementalmutations, Statuseffect } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { combineLatest } from 'rxjs'
import { NwDbService } from '~/nw'

@Injectable()
export class MutaElementDetailStore extends ComponentStore<{ elementId: string }> {
  public readonly elementId$ = this.select(({ elementId }) => elementId)
  public readonly element$ = this.select(this.db.mutatorElement(this.elementId$), (it) => it)
  public readonly wildcard$ = this.select(this.element$, (it) => it.CategoryWildcard)
  public readonly perksData$ = this.select(this.db.mutatorElementPerk(this.wildcard$), (it) => it)

  public readonly icon$ = this.select(this.element$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.element$, (it) => it?.Name)

  public readonly statusEffects$ = this.select(
    combineLatest({
      element: this.element$,
      buffMap: this.db.buffBucketsMap,
      effectMap: this.db.statusEffectsMap,
    }),
    ({ element, buffMap, effectMap }) => {
      return selectStatusEffects(element, buffMap, effectMap)
    }
  )

  public constructor(private db: NwDbService) {
    super({ elementId: null })
  }

  public load(idOrItem: string | Elementalmutations) {
    if (typeof idOrItem === 'string') {
      this.patchState({ elementId: idOrItem })
    } else {
      this.patchState({ elementId: idOrItem?.ElementalMutationId })
    }
  }
}

function selectStatusEffects(
  element: Elementalmutations,
  buffMap: Map<string, BuffBucket>,
  effectMap: Map<string, Statuseffect>
) {
  const tagged: Array<{ tag: string; effect: string }> = []
  const tags: Array<keyof Elementalmutations> = ['Dungeon-', 'Dungeon', 'Dungeon+', 'DungeonBoss', 'DungeonMiniBoss']
  for (const tag of tags) {
    tagged.push(
      ...collectStatusEffects(buffMap.get(element[tag] as string), buffMap).map((effect) => {
        return {
          tag: tag,
          effect: effect,
        }
      })
    )
  }
  const groups: Record<string, string[]> = {}
  for (const { tag, effect } of tagged) {
    if (!groups[effect]) {
      groups[effect] = []
    }
    if (!groups[effect].includes(tag)) groups[effect].push(tag)
  }

  return Object.entries(groups).map(([effect, tags]) => {
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
  }).filter((it) => !!it)
}

function collectStatusEffects(bucket: BuffBucket, bucketMap: Map<string, BuffBucket>, result: string[] = []): string[] {
  if (!bucket) {
    return result
  }
  for (const buff of bucket.Buffs) {
    if (buff.BuffType === 'StatusEffect') {

      result.push(buff.Buff)
      continue
    }
    if (buff.BuffType === 'BuffBucket') {
      const bucket = bucketMap.get(buff.Buff)
      collectStatusEffects(bucket, bucketMap, result)
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
  return result
}
