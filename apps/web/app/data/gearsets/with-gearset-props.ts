import { computed, inject } from '@angular/core'
import { signalStoreFeature, type, withComputed } from '@ngrx/signals'

import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { gearScoreRelevantSlots, getAverageGearScore, NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { BackendService } from '../backend'
import { ItemsService } from '../items'
import { SkillTreesService } from '../skill-tree'
import { GearsetRecord } from './types'
import { combineLatest, switchMap } from 'rxjs'

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
      const backend = inject(BackendService)
      const recordUserId = computed(() => backend.sessionUserId() || 'local')
      return {
        gearsetId: computed(() => gearset()?.id),
        gearsetName: computed(() => gearset()?.name),
        gearsetAttrs: computed(() => gearset()?.attrs),
        gearsetSlots: computed(() => gearset()?.slots),
        gearsetEnforcedEffects: computed(() => gearset()?.enforceEffects),
        gearsetEnforcedAbilities: computed(() => gearset()?.enforceAbilities),
        gearsetImageId: computed(() => gearset()?.imageId),
        gearsetUserid: computed(() => gearset()?.userId),
        level: computed(() => gearset()?.level ?? defaultLevel() ?? NW_MAX_CHARACTER_LEVEL),
        skills: computed(() => gearset()?.skills),
        skillsPrimary: computed(() => gearset()?.skills?.['primary']),
        skillsSecondary: computed(() => gearset()?.skills?.['secondary']),
        isPersistable: computed(() => !!gearset()?.id),
        isLinkMode: computed(() => gearset()?.createMode !== 'copy'),
        isCopyMode: computed(() => gearset()?.createMode === 'copy'),
        isSyncable: computed(() => recordUserId() !== 'local'),
        isSyncComplete: computed(() => gearset()?.syncState === 'synced'),
        isSyncPending: computed(() => gearset()?.syncState === 'pending' || !gearset()?.syncState),
        isSyncConflict: computed(() => gearset()?.syncState === 'conflict'),
        isOwned: computed(() => gearset()?.userId === recordUserId()),
        isPublished: computed(() => gearset()?.status === 'public'),
        isPrivate: computed(() => gearset()?.status !== 'public'),
        hasLinkedItems: computed(() => gearsetHasLinkedItems(gearset())),
        isPublishable: computed(() => !gearsetHasLinkedItems(gearset())),
      }
    }),
    withComputed(({ gearsetSlots, skills, gearsetUserid, level }) => {
      const itemsService = inject(ItemsService)
      const skillsService = inject(SkillTreesService)

      const resolvedSlots = toSignal(
        combineLatest({
          slots: toObservable(gearsetSlots),
          userId: toObservable(gearsetUserid),
        }).pipe(
          switchMap(({ slots, userId }) => {
            return itemsService.resolveGearsetSlots({
              slots,
              userId,
            })
          }),
        ),
        {
          initialValue: [],
        },
      )

      const resolvedSkills = toSignal(
        toObservable(skills).pipe(
          switchMap((params) => {
            return skillsService.resolveGearsetSkills(params)
          }),
        ),
        {
          initialValue: {
            primary: null,
            secondary: null,
          },
        },
      )

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

export function gearsetHasLinkedItems(gearset: GearsetRecord) {
  const slots = gearset?.slots
  if (!slots) {
    return false
  }
  for (const slot in slots) {
    if (typeof slots[slot] === 'string') {
      return true
    }
  }
  return false
}
