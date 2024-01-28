import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { AttributeRef, EquipSlotId } from '@nw-data/common'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { EquippedItem, Mannequin } from '~/nw/mannequin'
import { combineLatestOrEmpty } from '~/utils'
import { ItemInstancesDB } from '../items'
import { ItemInstance } from '../items/types'
import { SkillSet } from '../skillbuilds'
import { GearsetRecord } from './types'

export interface WithGearsetToMannequinState {
  gearset: GearsetRecord
  level: number
}
export function withGearsetToMannequin() {
  return signalStoreFeature(
    {
      state: type<WithGearsetToMannequinState>(),
    },
    withMethods(({ gearset, level }) => {
      const itemDB = inject(ItemInstancesDB)
      const gearset$ = toObservable(gearset)
      const level$ = toObservable(level)
      return {
        connectToMannequin: (mannequin: Mannequin) => {
          const src$ = combineLatest({
            level: level$,
            equippedItems: gearset$.pipe(switchMap((it) => resolveSlots(itemDB, it.slots))),
            equippedSkills1: gearset$.pipe(map((it) => resolveSkillBuild(it.skills?.['primary']))),
            equippedSkills2: gearset$.pipe(map((it) => resolveSkillBuild(it.skills?.['secondary']))),
            enforcedEffects: gearset$.pipe(map((it) => it.enforceEffects)),
            enforcedAbilities: gearset$.pipe(map((it) => it.enforceAbilities)),
            assignedAttributes: gearset$.pipe(
              map((it): Record<AttributeRef, number> => {
                return {
                  str: it.attrs?.str || 0,
                  dex: it.attrs?.dex || 0,
                  int: it.attrs?.int || 0,
                  foc: it.attrs?.foc || 0,
                  con: it.attrs?.con || 0,
                }
              }),
            ),
          })
          mannequin.patchState(src$)
        },
      }
    }),
  )
}

function resolveSkillBuild(skillTree: string | SkillSet) {
  if (typeof skillTree === 'string') {
    return null
  }
  return skillTree
}

function resolveSlots(db: ItemInstancesDB, slots: Record<string, string | ItemInstance>) {
  return combineLatestOrEmpty(
    Object.entries(slots || {}).map(([slotId, instanceOrId]) => {
      return resolveItemInstance(db, instanceOrId).pipe(
        map((instance): EquippedItem => {
          return {
            itemId: instance.itemId,
            perks: instance.perks,
            slot: slotId as EquipSlotId,
            gearScore: instance.gearScore,
          }
        }),
      )
    }),
  )
}

function resolveItemInstance(db: ItemInstancesDB, idOrInstance: string | ItemInstance) {
  if (typeof idOrInstance === 'string') {
    return db.live((t) => t.get(idOrInstance))
  }
  return of(idOrInstance)
}
