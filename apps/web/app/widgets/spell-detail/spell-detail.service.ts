import { Injectable, Output } from '@angular/core'
import { Spelltable } from '@nw-data/types'
import { map, ReplaySubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'

@Injectable()
export class SpellDetailService {
  public readonly spellId$ = new ReplaySubject<string>(1)

  @Output()
  public readonly spell$ = this.db.spell(this.spellId$).pipe(shareReplayRefCount(1))

  public readonly spellProps$ = this.spell$.pipe(map((it) => this.getProperties(it))).pipe(shareReplayRefCount(1))

  // public readonly refEffects$ = this.spell$.pipe(
  //   map((it) => {
  //     return uniq([
  //       it?.StatusEffect,
  //       it?.TargetStatusEffect,
  //       it?.OtherApplyStatusEffect,
  //       it?.DontHaveStatusEffect,
  //       it?.StatusEffectBeingApplied,
  //       it?.OnEquipStatusEffect,
  //       it?.DamageTableStatusEffectOverride,
  //       ...(it?.TargetStatusEffectDurationList || []),
  //       ...(it?.RemoveTargetStatusEffectsList || []),
  //       ...(it?.StatusEffectsList || []),
  //       ...(it?.SelfApplyStatusEffect || []),
  //     ]).filter((it) => !!it && it !== 'All')
  //   })
  // )

  public constructor(protected db: NwDbService) {
    //
  }

  public update(entityId: string) {
    this.spellId$.next(entityId)
  }

  public getProperties(ability: Spelltable, exclude?: Array<keyof Spelltable | '$source'>) {
    if (!ability) {
      return []
    }
    exclude = exclude || ['$source', 'SpellPrefabPath']
    return Object.entries(ability)
      .filter(([key, value]) => !!value && !exclude.includes(key as any))
      .reduce((res, [key, value]) => {
        res[key] = value
        return res
      }, {} as Partial<Spelltable>)
  }
}
