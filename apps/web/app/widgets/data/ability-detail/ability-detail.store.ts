import { payload, withRedux } from '@angular-architects/ngrx-toolkit'
import { computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { AbilityData, CooldownData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { EMPTY, catchError, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { humanize, rejectKeys, selectSignal } from '~/utils'

export interface AbilityDetailState {
  abilityId: string
  ability: AbilityData & { $source?: string }
  cooldown: CooldownData
  isLoaded: boolean
}

export type AbilityDetailStore = InstanceType<typeof AbilityDetailStore>
export const AbilityDetailStore = signalStore(
  withState<AbilityDetailState>({
    abilityId: null,
    ability: null,
    cooldown: null,
    isLoaded: false,
  }),
  withRedux({
    actions: {
      public: {
        load: payload<{ abilityId: string }>(),
      },
      private: {
        loaded: payload<Omit<AbilityDetailState, 'isLoaded'>>(),
      },
    },
    reducer(actions, on) {
      on(actions.load, (state) => {
        patchState(state, {
          isLoaded: false,
        })
      })
      on(actions.loaded, (state, data) => {
        patchState(state, {
          ...data,
          isLoaded: true,
        })
      })
    },
    effects(actions, create) {
      const db = inject(NwDataService)
      return {
        load$: create(actions.load).pipe(
          switchMap(({ abilityId }) => loadState(db, abilityId)),
          map((data) => actions.loaded(data)),
          catchError((error) => {
            console.error(error)
            return EMPTY
          }),
        ),
      }
    },
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
  withComputed(({ abilityId }) => {
    const db = inject(NwDataService)
    const ref1 = toSignal(db.abilitiesByRequiredAbilityId(abilityId), { initialValue: [] })
    const ref2 = toSignal(db.abilitiesByRequiredEquippedAbilityId(abilityId), { initialValue: [] })
    const ref3 = toSignal(db.abilitiesByAbilityList(abilityId), { initialValue: [] })
    return {
      foreignAbilities: computed(() => {
        return uniq([ref1() || [], ref2() || [], ref3() || []].flat().map((it) => it.AbilityID))
      }),
    }
  }),
)

function loadState(db: NwDataService, abilityId: string) {
  return db.ability(abilityId).pipe(
    switchMap((ability) => {
      const cooldownId = ability?.CooldownId
      return db.cooldownsByAbilityId(cooldownId).pipe(
        map((cooldowns) => ({
          abilityId,
          ability,
          cooldown: cooldowns?.[0],
        })),
      )
    }),
  )
}

function selectProperties(item: AbilityData) {
  const reject = ['$source', 'Icon', 'DisplayName', 'Description', 'Sound']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
