import { computed, inject, signal } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { getWeaponTagFromWeapon } from '@nw-data/common'
import { map, pipe, switchMap } from 'rxjs'
import { GearsetRecord, GearsetSkillSlot, injectNwData, ItemInstancesDB, SkillBuildsDB, SkillSet } from '~/data'
import { resolveGearsetSkill, resolveGearsetSlot } from '~/data/gearsets/utils'

export interface GearsetPaneSkillState {
  slot: GearsetSkillSlot
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
    const instancesDB = inject(ItemInstancesDB)
    const equippedWeaponTag = signal<string>(null)
    const equippedWeaponTagLoaded = signal<boolean>(false)
    const connect = rxMethod<{ gearset: GearsetRecord; slot: GearsetSkillSlot }>(
      pipe(
        switchMap(({ gearset, slot }) => {
          const slotId = slot === 'primary' ? 'weapon1' : 'weapon2'
          return resolveGearsetSlot(instancesDB, slotId, gearset?.slots?.[slotId]).pipe(
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
    const skillDB = inject(SkillBuildsDB)
    const instance = signal<SkillSet>(null)
    const instanceLoaded = signal<boolean>(false)
    const connect = rxMethod<{ gearset: GearsetRecord; slot: GearsetSkillSlot }>(
      pipe(
        switchMap(({ gearset, slot }) => resolveGearsetSkill(skillDB, gearset?.skills?.[slot])),
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
