import type { ScannedEquipType, ScannedVitalModel, ScannedVitalWeapon } from '@nw-data/generated'
import { uniq, uniqBy } from 'lodash'
import { equipTypeSocket } from './equip-type-socket'
import { characterDefinitionModelUri } from './get-model-uri'
import type { ModelSource } from './model-source'

/**
 * The models on a socket of a character and where they sit on it: meters, degrees about x, y, z. See
 * `ModelViewer.setSocket`
 */
export interface ModelSocketInfo {
  /**
   * Empty for the character's first socket
   */
  name: string
  models: Array<{ url: string; source: ModelSource }>
  offset: { position?: number[]; rotation?: number[] }
}

/**
 * The models that differ for a viewer: many slices place the same creature
 */
export function mergeVitalModels(models: ScannedVitalModel[]): ScannedVitalModel[] {
  return uniqBy(models, (it) => {
    return JSON.stringify([it.model, it.adb, vitalModelTags(it).sort(), it.weapons ?? [], it.table])
  })
}

/**
 * The tags a vital's model plays its animations with: its default tags and the ones of its weapons
 */
export function vitalModelTags(model: ScannedVitalModel): string[] {
  return uniq([...(model.tags ?? []), ...(model.weaponTags ?? [])])
}

/**
 * The name of the model's slice, e.g. `slices/characters/damned_villager_cleaver`: `Damned Villager Cleaver`
 */
export function vitalModelLabel(model: ScannedVitalModel): string {
  const name = model.id.split('/').at(-1)
  return name
    .split('_')
    .filter((it) => !!it)
    .map((it) => it[0].toUpperCase() + it.slice(1))
    .join(' ')
}

/**
 * The drawn weapons on their sockets. Weapons without a mesh (claws, fists) are left out, one without an equip type
 * sits on the first socket.
 */
export function vitalModelSockets(
  weapons: ScannedVitalWeapon[] | null | undefined,
  equipTypes: ReadonlyMap<string, ScannedEquipType>,
): ModelSocketInfo[] {
  const result = new Map<string, ModelSocketInfo>()
  for (const { mesh, equipType, offHand } of weapons ?? []) {
    if (!mesh) {
      continue
    }
    const type = equipTypes.get(equipType)
    const socket = type ? equipTypeSocket(type, { offHand, drawn: true }) : null
    const name = socket?.name ?? ''
    const info = result.get(name) ?? {
      name,
      models: [],
      offset: socket ? { position: socket.position, rotation: socket.rotation } : {},
    }
    info.models.push({ url: characterDefinitionModelUri(mesh), source: { model: mesh } })
    result.set(name, info)
  }
  return [...result.values()]
}

/**
 * The vital that owns a related model: one the slice spawns with the same base row
 */
export function relatedVitalId(
  model: ScannedVitalModel,
  baseVitalsId: string,
  vitals: ReadonlyMap<string, { BaseVitalsId?: string }>,
): string | null {
  const base = baseVitalsId?.toLowerCase()
  const found = model.vitalIds.find((it) => !!base && vitals.get(it)?.BaseVitalsId?.toLowerCase() === base)
  return found ?? model.vitalIds[0] ?? null
}
