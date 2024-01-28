import { computed, inject, signal } from '@angular/core'
import { signalStoreFeature, type, withComputed } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { map, pipe, switchMap } from 'rxjs'

import { gearScoreRelevantSlots, getAverageGearScore } from '@nw-data/common'
import { ItemInstancesDB } from '../items/items.db'
import { ItemInstance } from '../items/types'
import { SkillBuildsDB, SkillSet } from '../skillbuilds'
import { GearsetRecord, GearsetSkillSlot } from './types'
import { ResolvedGearsetSlot, resolveGearsetSkills, resolveGearsetSlots } from './utils'

export interface WithGearsetPropsState {
  gearset: GearsetRecord
  level: number
}

export function withGearsetProps() {
  return signalStoreFeature(
    {
      state: type<WithGearsetPropsState>(),
    },
    withComputed(({ gearset }) => {
      return {
        gearsetId: computed(() => gearset()?.id),
        gearsetName: computed(() => gearset()?.name),
        gearsetAttrs: computed(() => gearset()?.attrs),
        gearsetSlots: computed(() => gearset()?.slots),
        gearsetEnforcedEffects: computed(() => gearset()?.enforceEffects),
        gearsetEnforcedAbilities: computed(() => gearset()?.enforceAbilities),
        gearsetImageId: computed(() => gearset()?.imageId),
        skills: computed(() => gearset()?.skills),
        skillsPrimary: computed(() => gearset()?.skills?.['primary']),
        skillsSecondary: computed(() => gearset()?.skills?.['secondary']),
        isPersistable: computed(() => !!gearset()?.id),
        isLinkMode: computed(() => gearset()?.createMode !== 'copy'),
        isCopyMode: computed(() => gearset()?.createMode === 'copy'),
      }
    }),
    withComputed(({ gearsetSlots }) => {
      const itemDB = inject(ItemInstancesDB)
      const resolvedSlots = signal<ResolvedGearsetSlot[]>([])
      const connect = rxMethod<Record<string, string | ItemInstance>>(
        pipe(
          switchMap((it) => resolveGearsetSlots(itemDB, it)),
          map((slots) => resolvedSlots.set(slots)),
        ),
      )
      connect(gearsetSlots)
      return {
        resolvedSlots,
      }
    }),
    withComputed(({ skills }) => {
      const skillDB = inject(SkillBuildsDB)
      const resolvedSkills = signal<Record<GearsetSkillSlot, SkillSet>>({
        primary: null,
        secondary: null,
      })
      const connect = rxMethod<Record<string, string | SkillSet>>(
        pipe(
          switchMap((it) => resolveGearsetSkills(skillDB, it)),
          map((slots) => resolvedSkills.set(slots)),
        ),
      )
      connect(skills)
      return {
        resolvedSkills,
      }
    }),
    withComputed(({ resolvedSlots, level }) => {
      return {
        gearScore: computed(() => {
          const slotIds = gearScoreRelevantSlots().map(({ id }) => id)
          const slots = resolvedSlots()
            .filter((it) => slotIds.includes(it.slot))
            .map((it) => {
              return {
                id: it.slot,
                gearScore: it.instance?.gearScore,
              }
            })
          return getAverageGearScore(slots, level())
        }),
      }
    }),
  )
}
