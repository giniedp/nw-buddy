import { computed, inject, signal } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { getWeaponTagFromWeapon } from '@nw-data/common'
import { map, pipe, switchMap } from 'rxjs'
import { GearsetRecord, GearsetSkillTreeRef, injectNwData, ItemsService, SkillTreesService, SkillTree } from '~/data'

export interface GearsetPaneSkillState {
  slot: GearsetSkillTreeRef
  gearset: GearsetRecord
  compact: boolean
  disabled: boolean
}
export const GearsetPaneSkillStore = signalStore(
  { protectedState: false },
  withState<GearsetPaneSkillState>({
    slot: null,
    gearset: null,
    compact: false,
    disabled: false,
  }),
  withComputed((state) => {
    const db = injectNwData()
    const items = inject(ItemsService)
    const equippedWeaponTag = signal<string>(null)
    const equippedWeaponTagLoaded = signal<boolean>(false)
    const connect = rxMethod<{ gearset: GearsetRecord; slot: GearsetSkillTreeRef }>(
      pipe(
        switchMap(({ gearset, slot }) => {
          const slotId = slot === 'primary' ? 'weapon1' : 'weapon2'
          return items
            .resolveGearsetSlot({
              slotId,
              instance: gearset?.slots?.[slotId],
              userId: gearset?.userId,
            })
            .pipe(
              switchMap(({ instance }) => db.itemsById(instance?.itemId)),
              switchMap((item) => db.weaponItemsById(item?.ItemStatsRef)),
              map((it) => {
                equippedWeaponTag.set(getWeaponTagFromWeapon(it))
                equippedWeaponTagLoaded.set(true)
              }),
            )
        }),
      ),
    )
    connect(
      computed(() => {
        return {
          gearset: state.gearset(),
          slot: state.slot(),
        }
      }),
    )
    return {
      equippedWeaponTag,
    }
  }),
  withComputed((state) => {
    const skills = inject(SkillTreesService)
    const instance = signal<SkillTree>(null)
    const instanceLoaded = signal<boolean>(false)
    const connect = rxMethod<{ gearset: GearsetRecord; slot: GearsetSkillTreeRef }>(
      pipe(
        switchMap(({ gearset, slot }) => skills.resolveGearsetSkill(gearset?.skills?.[slot])),
        map((it) => {
          instance.set(it)
          instanceLoaded.set(true)
        }),
      ),
    )
    connect(
      computed(() => {
        return {
          gearset: state.gearset(),
          slot: state.slot(),
        }
      }),
    )
    return {
      instance,
      instanceLoaded,
    }
  }),
)
