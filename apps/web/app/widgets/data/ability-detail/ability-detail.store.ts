import { computed } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { AbilityData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { withNwData } from '~/data/with-nw-data'
import { humanize, rejectKeys } from '~/utils'

export interface AbilityDetailState {
  abilityId: string
}

export const AbilityDetailStore = signalStore(
  withState<AbilityDetailState>({ abilityId: null }),
  withNwData((db) => {
    return {
      abilitiesMap: db.abilitiesMap,
      cooldownsMap: db.cooldownsByAbilityIdMap,
    }
  }),
  withMethods((state) => {
    return {
      load(idOrItem: string | AbilityData) {
        if (typeof idOrItem === 'string') {
          patchState(state, { abilityId: idOrItem })
        } else {
          patchState(state, { abilityId: idOrItem?.AbilityID })
        }
      },
    }
  }),
  withHooks({
    onInit: (state) => {
      state.loadNwData()
    },
  }),
  withComputed(({ abilityId, nwData }) => {
    const ability = computed(() => nwData().abilitiesMap?.get(abilityId()))
    const cooldown = computed(() => nwData().cooldownsMap?.get(ability()?.CooldownId)?.[0])
    return {
      ability,
      icon: computed(() => ability()?.Icon || NW_FALLBACK_ICON),
      name: computed(() => ability()?.DisplayName),
      nameForDisplay: computed(() => ability()?.DisplayName || humanize(ability()?.AbilityID)),
      weapon: computed(() => ability()?.WeaponTag),
      weaponOrSource: computed(() => ability()?.WeaponTag || ability()?.$source),
      source: computed(() => ability()?.$source),
      uiCategory: computed(() => ability()?.UICategory),
      description: computed(() => ability()?.Description),
      properties: computed(() => selectProperties(ability())),
      cooldown: computed(() => cooldown()),
      refEffects: computed(() => {
        const it = ability()
        if (!it) {
          return []
        }
        return uniq(
          flatten([
            it.StatusEffect,
            it.TargetStatusEffect,
            it.OtherApplyStatusEffect,
            it.DontHaveStatusEffect,
            it.StatusEffectBeingApplied,
            it.OnEquipStatusEffect,
            it.DamageTableStatusEffectOverride,
            it.TargetStatusEffectDurationList,
            it.RemoveTargetStatusEffectsList,
            it.StatusEffectsList,
            it.SelfApplyStatusEffect,
          ]),
        ).filter((it) => !!it && it !== 'All')
      }),
      refSpells: computed(() => {
        const it = ability()
        if (!it) {
          return []
        }
        return uniq(flatten([it.CastSpell])).filter((it) => !!it && it !== 'All')
      }),
      refAbilities: computed(() => {
        const it = ability()
        if (!it) {
          return []
        }
        return uniq(flatten([it.RequiredEquippedAbilityId, it.RequiredAbilityId, it.AbilityList])).filter(
          (e) => !!e && e !== it.AbilityID,
        )
      }),
    }
  }),
)

function selectProperties(item: AbilityData) {
  const reject = ['$source', 'Icon', 'DisplayName', 'Description', 'Sound']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
