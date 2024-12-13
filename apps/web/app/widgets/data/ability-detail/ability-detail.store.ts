import { computed } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { AbilityData, CooldownData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { humanize, rejectKeys } from '~/utils'

export interface AbilityDetailState {
  abilityId: string
  ability: AbilityData & { $source?: string }
  cooldown: CooldownData
  foreignAbilities: string[]
}

export type AbilityDetailStore = InstanceType<typeof AbilityDetailStore>
export const AbilityDetailStore = signalStore(
  withState<AbilityDetailState>({
    abilityId: null,
    ability: null,
    cooldown: null,
    foreignAbilities: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: (data: { abilityId: string }) => loadState(db, data.abilityId),
    }
  }),
  withComputed(({ ability }) => {
    return {
      icon: computed(() => ability()?.Icon || NW_FALLBACK_ICON),
      name: computed(() => ability()?.DisplayName),
      nameForDisplay: computed(() => ability()?.DisplayName || humanize(ability()?.AbilityID)),
      weapon: computed(() => ability()?.WeaponTag),
      weaponOrSource: computed(() => ability()?.WeaponTag || ability()?.$source),
      source: computed(() => ability()?.$source),
      uiCategory: computed(() => ability()?.UICategory),
      description: computed(() => ability()?.Description),
      properties: computed(() => selectProperties(ability())),
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

function loadState(db: NwData, abilityId: string) {
  return from(db.abilitiesById(abilityId)).pipe(
    switchMap((ability) => {
      return combineLatest({
        abilityId: of(abilityId),
        ability: of(ability),
        cooldown: from(db.cooldownsByAbilityId(abilityId)).pipe(map((cooldowns) => cooldowns?.[0])),
        foreignAbilities: combineLatest([
          db.abilitiesByRequiredAbilityId(abilityId),
          db.abilitiesByRequiredEquippedAbilityId(abilityId),
          db.abilitiesByAbilityList(abilityId),
        ]).pipe(
          map((abilities) => {
            return uniq(abilities.flat().map((it) => it?.AbilityID)).filter((it) => !!it)
          }),
        ),
      })
    }),
  )
}

function selectProperties(item: AbilityData) {
  const reject: Array<keyof AbilityData> = ['Icon', 'DisplayName', 'Description', 'Sound']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
