import { Injector, effect, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { AttributeRef, EquipSlotId } from '@nw-data/common'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { EquippedItem, Mannequin } from '~/nw/mannequin'
import { combineLatestOrEmpty } from '~/utils'
import { ItemInstancesDB } from '../items'
import { ItemInstance } from '../items/types'
import { SkillBuildsDB } from '../skillbuilds'
import { GearsetRecord } from './types'
import { resolveGearsetSkill } from './utils'

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
      const injector = inject(Injector)
      const itemDB = inject(ItemInstancesDB)
      const skillDB = inject(SkillBuildsDB)
      const gearset$ = toObservable(gearset)
      const level$ = toObservable(level)
      const src$ = combineLatest({
        level: level$,
        equippedItems: gearset$.pipe(switchMap((it) => resolveSlots(itemDB, it?.slots))),
        equippedSkills1: gearset$.pipe(switchMap((it) => resolveGearsetSkill(skillDB, it?.skills?.['primary']))),
        equippedSkills2: gearset$.pipe(switchMap((it) => resolveGearsetSkill(skillDB, it?.skills?.['secondary']))),
        enforcedEffects: gearset$.pipe(map((it) => it?.enforceEffects)),
        enforcedAbilities: gearset$.pipe(map((it) => it?.enforceAbilities)),
        magnifyPlacement: gearset$.pipe(map((it) => it?.magnify)),
        assignedAttributes: gearset$.pipe(
          map((it): Record<AttributeRef, number> => {
            return {
              str: it?.attrs?.str || 0,
              dex: it?.attrs?.dex || 0,
              int: it?.attrs?.int || 0,
              foc: it?.attrs?.foc || 0,
              con: it?.attrs?.con || 0,
            }
          }),
        ),
      })

      return {
        connectToMannequin: (mannequin: Mannequin) => {
          const patch = toSignal(src$, { injector: injector })
          effect(() => {
            const data = patch()
            if (data) {
              patchState(mannequin.state, data)
            }
          }, {
            injector: injector,
            allowSignalWrites: true
          })
        },
      }
    }),

  )
}

function resolveSlots(db: ItemInstancesDB, slots: GearsetRecord['slots']) {
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
    return db.observeByid(idOrInstance)// live((t) => t.get(idOrInstance))
  }
  return of(idOrInstance)
}
