import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { EquipSlotId, ItemPerkInfo, NW_MAX_CHARACTER_LEVEL, PerkBucket, getItemPerkInfos } from '@nw-data/common'
import { MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { Observable, catchError, combineLatest, map, of, pipe, switchMap } from 'rxjs'

import { inject } from '@angular/core'
import { NwData } from '@nw-data/db'
import { combineLatestOrEmpty } from '~/utils/rx/combine-latest-or-empty'
import { ItemInstancesDB } from '../items/items.db'
import { ItemInstance } from '../items/types'
import { GearsetsService } from './gearsets.service'
import { GearsetRecord } from './types'
import { withGearsetMethods } from './with-gearset-methods'
import { withGearsetProps } from './with-gearset-props'
import { withGearsetToMannequin } from './with-gearset-to-mannequin'

export interface GearsetStoreState {
  defaultLevel: number
  gearset: GearsetRecord
  isLoaded: boolean
  showCalculator: boolean
  showItemInfo: boolean
}

export type GearsetStore = InstanceType<typeof GearsetStore>
export const GearsetStore = signalStore(
  { protectedState: false },
  withState<GearsetStoreState>({
    defaultLevel: NW_MAX_CHARACTER_LEVEL,
    gearset: null,
    isLoaded: false,
    showCalculator: false,
    showItemInfo: true,
  }),
  withGearsetProps(),
  withGearsetMethods(),
  withGearsetToMannequin(),
  withMethods((state) => {
    const service = inject(GearsetsService)
    return {
      connectGearsetId: rxMethod<{ userId: string; id: string }>(
        pipe(
          switchMap((source) => {
            return service.observeRecord(source)
          }),
          catchError((err) => {
            console.error(err)
            return of(null)
          }),
          map((gearset) => {
            patchState(state, { gearset: gearset, isLoaded: true })
          }),
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
            patchState(state, { defaultLevel: level })
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
  return instanceId ? itemDB.observeById(instanceId) : of(instance)
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
  item: MasterItemDefinitions
  perks: ResolvedItemPerkInfo[]
}
export interface ResolvedItemPerkInfo extends ItemPerkInfo {
  bucket: PerkBucket
  perk: PerkData
}
export function resolveGearsetSlotItems(record: GearsetRecord, itemDB: ItemInstancesDB, db: NwData) {
  return combineLatest({
    slots: resolveGearsetSlotInstances(record, itemDB),
    items: db.itemsByIdMap(),
    perks: db.perksByIdMap(),
    buckets: db.perkBucketsByIdMap(),
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
