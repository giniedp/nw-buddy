import { inject } from '@angular/core'
import { signalStoreFeature, type, withMethods } from '@ngrx/signals'
import { EquipSlotId } from '@nw-data/common'
import { PerkData } from '@nw-data/generated'
import { ItemInstance, ItemsService } from '../items'
import { SkillTree } from '../skill-tree/types'
import { GearsetsService } from './gearsets.service'
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
      const gears = inject(GearsetsService)
      return {
        getCopy: () => {
          return makeCopy(gearset())
        },
        async patchSlot(slot: EquipSlotId, patchValue: string | Partial<ItemInstance>) {
          return gears.patchSlot({
            gearset: gearset(),
            slot,
            value: patchValue,
          })
        },
        async updateSlot(slot: EquipSlotId, patchValue: string | Partial<ItemInstance>) {
          return gears.updateSlot({
            gearset: gearset(),
            slot,
            value: patchValue,
          })
        },
        patchGearset(patchValue: Partial<GearsetRecord>) {
          return gears.update(gearset().id, {
            ...gearset(),
            ...patchValue,
          })
        },
        destroyGearset() {
          return gears.delete(gearset().id)
        },
      }
    }),
    withMethods(({ gearset, patchSlot, patchGearset }) => {
      const items = inject(ItemsService)
      return {
        update: patchGearset,
        updateSlotGearScore: async (slot: EquipSlotId, gearScore: number) => {
          return patchSlot(slot, { gearScore })
        },
        updateSlotPerk: async (slot: EquipSlotId, perkKey: string, perk: PerkData) => {
          const { instance } = await resolveSlot(gearset(), slot, items)
          const perks = makeCopy(instance?.perks || {})
          perks[perkKey] = perk?.PerkID || null
          await patchSlot(slot, { perks })
        },
        updateLevel: async (level: number) => {
          await patchGearset({ level })
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

        async updateSkill(slot: string, skill: SkillTree) {
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

async function resolveSlot(gearset: GearsetRecord, slot: EquipSlotId, itemDB: ItemsService) {
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
