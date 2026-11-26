import type { EquipSlotId } from '@nw-data/common'
import type { ScannedEquipSocket, ScannedEquipType } from '@nw-data/generated'
import { equipTypeSocket } from '~/widgets/model-viewer/utils/equip-type-socket'

/**
 * The weapon slots, named as the gear sets' (`weapon3` is the shield)
 */
export type WeaponSlotId = Extract<EquipSlotId, 'weapon1' | 'weapon2' | 'weapon3'>

export const WEAPON_SLOTS: WeaponSlotId[] = ['weapon1', 'weapon2', 'weapon3']

/**
 * The socket of a weapon slot's model, by the weapon's equip type: weapon 1 takes the main entries and goes into the
 * hand when drawn, weapon 2 the off-hand entries and stays sheathed, weapon 3 (the shield) the off-hand entries (a
 * shield's equip type has no main entries). Falls back to the other hand's entries when the type has none.
 */
export function weaponSocket(slot: WeaponSlotId, type: ScannedEquipType, drawn: boolean): ScannedEquipSocket | null {
  return equipTypeSocket(type, { offHand: slot !== 'weapon1', drawn: drawn && slot !== 'weapon2' })
}

/**
 * The equip type of a weapon appearance: the one of its own weapons (`WeaponItemDefinitions.EquipType` of the items
 * that show it), else the most frequent one of its weapon class (most appearances have no item of their own)
 */
export function weaponEquipType(
  ownTypes: string[],
  weaponClass: string,
  typesByClass: ReadonlyMap<string, string>,
): string | null {
  return ownTypes[0] ?? typesByClass.get(weaponClass) ?? null
}

/**
 * The most frequent equip type per weapon class
 *
 * @param entries - per weapon appearance its weapon class and the equip types of its items
 */
export function equipTypesByClass(entries: Iterable<{ weaponClass: string; types: string[] }>): Map<string, string> {
  const counts = new Map<string, Map<string, number>>()
  for (const { weaponClass, types } of entries) {
    if (!weaponClass) {
      continue
    }
    const byType = counts.get(weaponClass) ?? new Map<string, number>()
    for (const type of types) {
      byType.set(type, (byType.get(type) ?? 0) + 1)
    }
    counts.set(weaponClass, byType)
  }
  const result = new Map<string, string>()
  for (const [weaponClass, byType] of counts) {
    let best: string | null = null
    let bestCount = 0
    for (const [type, count] of byType) {
      if (count > bestCount) {
        best = type
        bestCount = count
      }
    }
    if (best) {
      result.set(weaponClass, best)
    }
  }
  return result
}

/**
 * A model to place: the weapon slot, its model and its equip type
 */
export interface WeaponPlacement<T> {
  slot: WeaponSlotId
  model: T
  equipType: ScannedEquipType
}

/**
 * The models per socket for the weapons, with the socket's offset; models of the same socket share it (the first
 * one's offset)
 */
export function weaponSockets<T>(
  placements: Iterable<WeaponPlacement<T>>,
  drawn: boolean,
): Record<string, { models: T[]; offset: { position: number[]; rotation: number[] } }> {
  const result: Record<string, { models: T[]; offset: { position: number[]; rotation: number[] } }> = {}
  for (const it of placements) {
    const socket = weaponSocket(it.slot, it.equipType, drawn)
    if (!socket) {
      continue
    }
    result[socket.name] ??= { models: [], offset: { position: socket.position, rotation: socket.rotation } }
    result[socket.name].models.push(it.model)
  }
  return result
}
