import { computed, inject } from '@angular/core'
import { signalStoreFeature, type, withComputed } from '@ngrx/signals'

import { rxResource } from '@angular/core/rxjs-interop'
import { gearScoreRelevantSlots, getAverageGearScore, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { ItemsService } from '../items'
import { SkillBuildsService } from '../skillbuilds'
import { GearsetRecord } from './types'
import { resolveGearsetSlots } from './utils'

export interface WithGearsetPropsState {
  gearset: GearsetRecord
  defaultLevel: number
}

export function withGearsetProps() {
  return signalStoreFeature(
    {
      state: type<WithGearsetPropsState>(),
    },
    withComputed(({ gearset, defaultLevel }) => {
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
        isSynced: computed(() => gearset()?.syncState === 'synced'),
        isSyncPending: computed(() => gearset()?.syncState === 'pending' || !gearset()?.syncState),
        isSyncConflicted: computed(() => gearset()?.syncState === 'conflict'),
        level: computed(() => gearset()?.level ?? defaultLevel() ?? NW_MAX_CHARACTER_LEVEL),
      }
    }),
    withComputed(({ gearsetSlots, skills, gearset, level }) => {
      const items = inject(ItemsService)

      const resolvedSlots = rxResource({
        params: gearsetSlots,
        stream: ({ params }) => {
          return resolveGearsetSlots(items, {
            slots: params,
            userId: gearset()?.userId,
          })
        },
        defaultValue: [],
      }).value

      const resolvedSkills = rxResource({
        params: skills,
        stream: ({ params }) => {
          const skillStore = inject(SkillBuildsService)
          return skillStore.resolveGearsetSkills(params)
        },
        defaultValue: {
          primary: null,
          secondary: null,
        },
      }).value

      const gearScore = computed(() => {
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
      })

      return {
        resolvedSlots,
        resolvedSkills,
        gearScore,
      }
    }),
  )
}
