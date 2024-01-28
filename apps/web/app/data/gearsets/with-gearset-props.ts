import { computed, inject, signal } from '@angular/core'
import { signalStoreFeature, type, withComputed, withMethods } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { Observable, combineLatest, map, of, pipe, switchMap } from 'rxjs'

import { EquipSlotId, gearScoreRelevantSlots, getAverageGearScore } from '@nw-data/common'
import { combineLatestOrEmpty } from '~/utils'
import { ItemInstancesDB } from '../items/items.db'
import { ItemInstance } from '../items/types'
import { GearsetRecord } from './types'

export interface ResolvedGearsetSlot {
  slot: EquipSlotId
  instanceId: string
  instance: ItemInstance
}

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
      const syncItems = rxMethod<Record<string, string | ItemInstance>>(
        pipe(
          resolveSlots(itemDB),
          map((slots) => resolvedSlots.set(slots)),
        ),
      )
      syncItems(gearsetSlots)
      return {
        resolvedSlots,
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

function resolveSlots(db: ItemInstancesDB) {
  return switchMap((slots: GearsetRecord['slots']) => {
    return combineLatestOrEmpty(
      Object.entries(slots || {}).map(([slot, instance]): Observable<ResolvedGearsetSlot> => {
        if (typeof instance === 'string') {
          return combineLatest({
            slot: of(slot as EquipSlotId),
            instanceId: of(instance),
            instance: db.live((t) => t.get(instance)),
          })
        }
        return combineLatest({
          slot: of(slot as EquipSlotId),
          instanceId: of<string>(null),
          instance: of(instance),
        })
      }),
    )
  })
}
