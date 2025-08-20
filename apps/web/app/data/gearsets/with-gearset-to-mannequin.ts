import { Injector, Signal, computed, effect, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { AttributeRef, EquipSlotId } from '@nw-data/common'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { EquippedItem, Mannequin } from '~/nw/mannequin'
import { combineLatestOrEmpty } from '~/utils'
import { ItemsService } from '../items'
import { ItemInstance } from '../items/types'
import { SkillTreesService } from '../skill-tree'
import { GearsetRecord } from './types'

export interface WithGearsetToMannequinState {
  gearset: GearsetRecord
  level: number
}
export function withGearsetToMannequin() {
  return signalStoreFeature(
    {
      state: type<{ gearset: GearsetRecord }>(),
      props: type<{ level: Signal<number> }>(),
    },
    withMethods(({ gearset, level }) => {
      const injector = inject(Injector)
      const items = inject(ItemsService)
      const skills = inject(SkillTreesService)
      const gearset$ = toObservable(gearset)
      const level$ = toObservable(
        computed(() => {
          const gsLevel = gearset()?.level
          const inputLevel = level()
          return gsLevel || inputLevel
        }),
      )
      const src$ = combineLatest({
        level: level$,
        equippedItems: gearset$.pipe(switchMap((it) => resolveSlots(items, gearset()?.userId, it?.slots))),
        equippedSkills1: gearset$.pipe(switchMap((it) => skills.resolveGearsetSkill(it?.skills?.['primary']))),
        equippedSkills2: gearset$.pipe(switchMap((it) => skills.resolveGearsetSkill(it?.skills?.['secondary']))),
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
          effect(
            () => {
              const data = patch()
              if (data) {
                patchState(mannequin.state, data)
              }
            },
            {
              injector: injector,
            },
          )
        },
      }
    }),
  )
}

function resolveSlots(db: ItemsService, userId: string, slots: GearsetRecord['slots']) {
  return combineLatestOrEmpty(
    Object.entries(slots || {}).map(([slotId, instanceOrId]) => {
      return resolveItemInstance(db, userId, instanceOrId).pipe(
        map((instance): EquippedItem => {
          if (!instance) {
            return null
          }
          return {
            itemId: instance.itemId,
            perks: instance.perks,
            slot: slotId as EquipSlotId,
            gearScore: instance.gearScore,
          }
        }),
      )
    }),
  ).pipe(map((it) => it.filter((it) => it !== null)))
}

function resolveItemInstance(db: ItemsService, userId: string, idOrInstance: string | ItemInstance) {
  if (typeof idOrInstance === 'string') {
    return db.observeRecord({ userId: userId, id: idOrInstance })
  }
  return of(idOrInstance)
}
