import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId, ItemPerkInfo, NW_MAX_CHARACTER_LEVEL, PerkBucket, getItemPerkInfos } from '@nw-data/common'
import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { Observable, combineLatest, map, of, pipe, switchMap } from 'rxjs'

import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { ItemInstancesDB } from '../items/items.db'
import { ItemInstance } from '../items/types'
import { NwDataService } from '../nw-data/nw-data.service'
import { GearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'
import { withGearsetMethods } from './with-gearset-methods'
import { withGearsetProps } from './with-gearset-props'
import { withGearsetToMannequin } from './with-gearset-to-mannequin'

export interface GearsetSignalStoreState {
  readonly: boolean
  level: number
  gearset: GearsetRecord
  isLoaded: boolean
}

export type GearsetSignalStore = InstanceType<typeof GearsetSignalStore>
export const GearsetSignalStore = signalStore(
  withState<GearsetSignalStoreState>({
    level: NW_MAX_CHARACTER_LEVEL,
    gearset: null,
    isLoaded: false,
    readonly: false,
  }),
  withGearsetProps(),
  withGearsetMethods(),
  withGearsetToMannequin(),
  withMethods((state) => {
    const db = inject(GearsetsDB)
    return {
      connectGearsetDB: rxMethod<string>(
        pipe(
          switchMap((id) => db.observeByid(id)),
          map((gearset) => patchState(state, { gearset, isLoaded: true })),
        ),
      ),
      connectGearset: rxMethod<GearsetRecord>(
        pipe(
          map((gearset) => {
            patchState(state, { gearset: gearset, isLoaded: true })
          }),
        ),
      ),
      connectLevel: rxMethod<number>(
        pipe(
          map((level) => {
            patchState(state, { level })
          }),
        ),
      ),
    }
  }),
)

function decodeSlot(slot: string | ItemInstance) {
  const instanceId = typeof slot === 'string' ? slot : null
  const instance = typeof slot !== 'string' ? slot : null
  return {
    instanceId,
    instance,
  }
}

export function resolveSlotItemInstance(
  slot: string | ItemInstance,
  itemDB: ItemInstancesDB,
): Observable<ItemInstance> {
  const { instance, instanceId } = decodeSlot(slot)
  return instanceId ? itemDB.live((t) => t.get(instanceId)) : of(instance)
}

export function resolveGearsetSlotInstances(record: GearsetRecord, itemDB: ItemInstancesDB) {
  return combineLatestOrEmpty(
    Object.entries(record.slots).map(([slot, instance]) => {
      return combineLatest({
        slot: of(slot as EquipSlotId),
        instanceId: of(typeof instance === 'string' ? instance : null),
        instance: resolveSlotItemInstance(instance, itemDB),
      })
    }),
  )
}

export interface ResolvedGersetSlotItem {
  slot: EquipSlotId
  instance: ItemInstance
  item: ItemDefinitionMaster
  perks: ResolvedItemPerkInfo[]
}
export interface ResolvedItemPerkInfo extends ItemPerkInfo {
  bucket: PerkBucket
  perk: Perks
}
export function resolveGearsetSlotItems(record: GearsetRecord, itemDB: ItemInstancesDB, db: NwDataService) {
  return combineLatest({
    slots: resolveGearsetSlotInstances(record, itemDB),
    items: db.itemsMap,
    perks: db.perksMap,
    buckets: db.perkBucketsMap,
  }).pipe(
    map(({ slots, items, perks, buckets }): ResolvedGersetSlotItem[] => {
      return slots.map(({ slot, instance }): ResolvedGersetSlotItem => {
        const item = items.get(instance?.itemId)
        return {
          slot,
          instance,
          item,
          perks: getItemPerkInfos(item, instance.perks).map((it): ResolvedItemPerkInfo => {
            return {
              ...it,
              bucket: buckets.get(it.bucketId),
              perk: perks.get(it.perkId),
            }
          }),
        }
      })
    }),
  )
}
