import { Injectable, Output } from '@angular/core'
import { Ability } from '@nw-data/types'
import { flatten, uniq } from 'lodash'
import { combineLatest, map, ReplaySubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { humanize, mapFilter, rejectKeys, shareReplayRefCount } from '~/utils'

@Injectable()
export class AbilityDetailService {
  public readonly abilityId$ = new ReplaySubject<string>(1)

  @Output()
  public readonly ability$ = combineLatest({
    id: this.abilityId$,
    abilitiesMap: this.db.abilitiesMap,
  })
    .pipe(map(({ id, abilitiesMap }) => abilitiesMap.get(id)))
    .pipe(shareReplayRefCount(1))

  public readonly icon$ = this.ability$.pipe(map((it) => it?.Icon || NW_FALLBACK_ICON))
  public readonly name$ = this.ability$.pipe(map((it) => it?.DisplayName))
  public readonly nameForDisplay$ = this.ability$.pipe(map((it) => it?.DisplayName || humanize(it?.AbilityID)))
  public readonly weapon$ = this.ability$.pipe(map((it) => it?.WeaponTag))
  public readonly weaponOrSource$ = this.ability$.pipe(map((it) => it?.WeaponTag || it?.['$source']))
  public readonly uiCategory$ = this.ability$.pipe(map((it) => it?.UICategory))
  public readonly description$ = this.ability$.pipe(map((it) => it?.Description))
  public readonly properties$ = this.ability$.pipe(map(reduceProps)).pipe(shareReplayRefCount(1))

  public readonly refEffects$ = this.ability$.pipe(
    map((it) => {
      return uniq(
        flatten([
          it?.StatusEffect,
          it?.TargetStatusEffect,
          it?.OtherApplyStatusEffect,
          it?.DontHaveStatusEffect,
          it?.StatusEffectBeingApplied,
          it?.OnEquipStatusEffect,
          it?.DamageTableStatusEffectOverride,
          it?.TargetStatusEffectDurationList,
          it?.RemoveTargetStatusEffectsList,
          it?.StatusEffectsList,
          it?.SelfApplyStatusEffect,
        ])
      )
    }),
    mapFilter((it) => !!it && it !== 'All')
  )

  public readonly refSpells$ = this.ability$.pipe(
    map((it) => {
      return uniq(flatten([it?.CastSpell]))
    }),
    mapFilter((it) => !!it && it !== 'All')
  )

  public readonly refAbilities$ = this.ability$.pipe(
    map((it) => {
      return uniq(flatten([it?.RequiredEquippedAbilityId, it?.RequiredAbilityId, it?.AbilityList]))
        .filter((e) => !!e)
        .filter((e) => e !== it.AbilityID)
    })
  )

  public constructor(protected db: NwDbService) {
    //
  }

  public load(idOrItem: string | Ability) {
    if (typeof idOrItem === 'string') {
      this.abilityId$.next(idOrItem)
    } else {
      this.abilityId$.next(idOrItem?.AbilityID)
    }
  }
}

function reduceProps(item: Ability) {
  const reject = ['$source', 'Icon', 'DisplayName', 'Description', 'Sound']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
