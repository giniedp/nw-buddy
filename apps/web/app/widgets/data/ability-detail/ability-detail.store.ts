import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { Ability } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { NwDbService } from '~/nw'
import { humanize, rejectKeys } from '~/utils'

@Injectable()
export class AbilityDetailStore extends ComponentStore<{ abilityId: string }> {
  protected db = inject(NwDbService)

  public readonly abilityId$ = this.select(({ abilityId }) => abilityId)

  @Output()
  public readonly ability$ = this.select(this.db.ability(this.abilityId$), (it) => it)

  public readonly icon$ = this.select(this.ability$, (it) => it?.Icon || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.ability$, (it) => it?.DisplayName)
  public readonly nameForDisplay$ = this.select(this.ability$, (it) => it?.DisplayName || humanize(it?.AbilityID))
  public readonly weapon$ = this.select(this.ability$, (it) => it?.WeaponTag)
  public readonly weaponOrSource$ = this.select(this.ability$, (it) => it?.WeaponTag || it?.['$source'])
  public readonly uiCategory$ = this.select(this.ability$, (it) => it?.UICategory)
  public readonly description$ = this.select(this.ability$, (it) => it?.Description)
  public readonly properties$ = this.select(this.ability$, selectProperties)

  public readonly refEffects$ = this.select(this.ability$, (it) => {
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
    ).filter((it) => !!it && it !== 'All')
  })

  public readonly refSpells$ = this.select(this.ability$, (it) => {
    return uniq(flatten([it?.CastSpell])).filter((it) => !!it && it !== 'All')
  })

  public readonly refAbilities$ = this.select(this.ability$, (it) => {
    return uniq(flatten([it?.RequiredEquippedAbilityId, it?.RequiredAbilityId, it?.AbilityList])).filter(
      (e) => !!e && e !== it.AbilityID
    )
  })

  public constructor() {
    super({ abilityId: null })
  }

  public load(idOrItem: string | Ability) {
    if (typeof idOrItem === 'string') {
      this.patchState({ abilityId: idOrItem })
    } else {
      this.patchState({ abilityId: idOrItem?.AbilityID })
    }
  }
}

function selectProperties(item: Ability) {
  const reject = ['$source', 'Icon', 'DisplayName', 'Description', 'Sound']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
