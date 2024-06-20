import { inject } from '@angular/core'
import { signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { EquipSlotId } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { ImagesDB } from '../images'
import { ItemInstance, ItemInstancesDB } from '../items'
import { SkillSet } from '../skillbuilds/types'
import { GearsetsDB } from './gearsets.db'
import { GearsetRecord } from './types'

export interface WithGearsetMethodsState {
  gearset: GearsetRecord
}
export function withGearsetMethods() {
  return signalStoreFeature(
    {
      state: type<WithGearsetMethodsState>(),
    },
    withMethods(({ gearset }) => {
      const gearDB = inject(GearsetsDB)
      const itemDB = inject(ItemInstancesDB)
      return {
        clone: () => {
          return makeCopy(gearset())
        },
        async patchSlot(slot: EquipSlotId, patchValue: string | Partial<ItemInstance>) {
          if (patchValue == null) {
            // clear slot
            const record = makeCopy(gearset())
            record.slots = record.slots || {}
            delete record.slots[slot]
            gearDB.update(record.id, record)
            return
          }
          if (typeof patchValue === 'string') {
            // set slot to item instance id
            const record = makeCopy(gearset())
            record.slots = record.slots || {}
            record.slots[slot] = patchValue
            gearDB.update(record.id, record)
            return
          }

          const instance = gearset().slots?.[slot] || null
          if (typeof instance === 'string') {
            // patch the item instance
            const data = await itemDB.read(instance)
            await itemDB.update(instance, {
              ...data,
              ...patchValue,
              perks: {
                ...(data.perks || {}),
                ...(patchValue.perks || {}),
              }
            })
            return
          }
          // patch data on the gearset
          const record = makeCopy(gearset())
          record.slots = record.slots || {}
          record.slots[slot] = {
            ...(instance || { itemId: null, gearScore: null }),
            ...(patchValue || {}),
            perks: {
              ...(instance?.perks || {}),
              ...(patchValue?.perks || {}),
            }
          }
          gearDB.update(record.id, record)
        },
        async updateSlot(slot: EquipSlotId, patchValue: string | Partial<ItemInstance>) {
          if (patchValue == null) {
            // clear slot
            const record = makeCopy(gearset())
            record.slots = record.slots || {}
            delete record.slots[slot]
            gearDB.update(record.id, record)
            return
          }
          if (typeof patchValue === 'string') {
            // set slot to item instance id
            const record = makeCopy(gearset())
            record.slots = record.slots || {}
            record.slots[slot] = patchValue
            gearDB.update(record.id, record)
            return
          }

          // patch data on the gearset
          const record = makeCopy(gearset())
          record.slots = record.slots || {}
          record.slots[slot] = {
            ...(record.slots[slot] || ({} as any)),
            ...patchValue,
          }
          gearDB.update(record.id, record)
        },
        patchGearset(patchValue: Partial<GearsetRecord>) {
          return gearDB.update(gearset().id, {
            ...gearset(),
            ...patchValue,
          })
        },
        destroyGearset() {
          return gearDB.destroy(gearset().id)
        },
      }
    }),
    withMethods(({ gearset, patchSlot, patchGearset }) => {
      const itemDB = inject(ItemInstancesDB)
      const imagesDb = inject(ImagesDB)
      return {
        updateSlotGearScore: async (slot: EquipSlotId, gearScore: number) => {
          return patchSlot(slot, { gearScore })
        },
        updateSlotPerk: async (slot: EquipSlotId, perkKey: string, perk: PerkData) => {
          const { instance } = await resolveSlot(gearset(), slot, itemDB)
          const perks = makeCopy(instance?.perks || {})
          if (perk) {
            perks[perkKey] = perk.PerkID
          } else {
            delete perks[perkKey]
          }
          await patchSlot(slot, { perks })
        },
        updateGearsetImage: async (file: File) => {
          const buffer = await file.arrayBuffer()
          const gearset = this.get().gearset
          const oldId = gearset.imageId
          const result = await imagesDb.db.transaction('rw', imagesDb.table, async () => {
            if (oldId) {
              await imagesDb.destroy(oldId)
            }
            return imagesDb.create({
              id: null,
              type: file.type,
              data: buffer,
            })
          })
          await patchGearset({ imageId: result.id })
        },

        async updateStatusEffects(updates: Array<{ id: string; stack: number }>) {
          const record = makeCopy(gearset())
          const effects = (record.enforceEffects = record.enforceEffects || [])
          for (const { id, stack } of updates) {
            const index = effects.findIndex((it) => it.id === id)
            if (index >= 0) {
              effects[index] = { id, stack }
            } else {
              effects.push({ id, stack })
            }
          }
          record.enforceEffects = effects.filter((it) => it.stack > 0)
          await patchGearset(record)
        },

        async updateSkill(slot: string, skill: SkillSet) {
          const record = makeCopy(gearset())
          record.skills = record.skills || {}
          if (skill) {
            record.skills[slot] = skill
          } else {
            delete record.skills[slot]
          }
          await patchGearset(record)
        },

        async updateGearsetSlots(
          slots: Array<{ slot: EquipSlotId; gearScore?: number; perks?: Array<{ perkId: string; key: string }> }>,
        ) {
          const newRecord = makeCopy(gearset())
          for (const { slot, gearScore, perks } of slots) {
            const { instance, instanceId } = decodeSlot(gearset()?.slots[slot])
            if (instance) {
              newRecord.slots[slot] = mergeItemInstance(instance, { gearScore, perks })
            } else if (instanceId) {
              this.itemDb.read(instanceId).then((record) => {
                const toUpdate = mergeItemInstance(record, { gearScore, perks })
                return this.itemDb.update(instanceId, toUpdate)
              })
            }
          }
          await patchGearset(newRecord)
        },
      }
    }),
  )
}

function decodeSlot(slot: string | ItemInstance) {
  const instanceId = typeof slot === 'string' ? slot : null
  const instance = typeof slot !== 'string' ? slot : null
  return {
    instanceId,
    instance,
  }
}

async function resolveSlot(gearset: GearsetRecord, slot: EquipSlotId, itemDB: ItemInstancesDB) {
  const instanceOrId = gearset.slots?.[slot]
  const instanceId = typeof instanceOrId === 'string' ? instanceOrId : null
  const instance = instanceId ? await itemDB.read(instanceId) : null
  return {
    instanceId,
    instance,
  }
}

function makeCopy<T>(it: T) {
  return JSON.parse(JSON.stringify(it)) as T
}

function mergeItemInstance(
  record: ItemInstance,
  patch: { gearScore?: number; perks?: Array<{ perkId: string; key: string }> },
) {
  const toUpdate: ItemInstance = makeCopy(record)
  if (patch?.gearScore) {
    toUpdate.gearScore = patch?.gearScore
  }
  if (patch?.perks) {
    for (const { key, perkId } of patch.perks) {
      if (perkId) {
        toUpdate.perks[key] = perkId
      } else {
        delete toUpdate.perks[key]
      }
    }
  }
  return toUpdate
}
