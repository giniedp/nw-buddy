import {
  ArmorAppearanceDefinitions,
  CostumeChangeData,
  HouseItems,
  MountData,
  ScannedVitalModel,
  WeaponAppearanceDefinitions,
  WeaponItemDefinitions,
} from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export function maleModelUri() {
  return normalizeUri('/objects/characters/player/male/player_male.glb')
}

export function femaleModelUri() {
  return normalizeUri('/objects/characters/player/female/player_female.glb')
}

export function housingItemModelUri(item: HouseItems) {
  return prefabModelUri(item?.PrefabPath)
}

export function prefabModelUri(prefabPath: string) {
  if (!prefabPath) {
    return null
  }
  return normalizeUri(`/slices/${prefabPath}.glb`)
}

export function vitalModelUri(vitalId: string, registry: Map<string, ScannedVitalModel>) {
  const id = registry.get(vitalId)?.id
  return vitalModelUriById(id)
}

export function vitalModelUriById(id: string) {
  if (!id) {
    return null
  }
  return normalizeUri(`/vitals/${id}.glb`)
}

export function mountModelUri(item: MountData) {
  if (!item?.MountId) {
    return null
  }
  return normalizeUri(`/mounts/${item.MountId}.glb`)
}

export function costumeModelUri(item: CostumeChangeData) {
  if (!item) {
    return null
  }
  return normalizeUri(`/costumechanges/${item.CostumeChangeId}.glb`)
}

export function itemAppearanceModelUri(item: ArmorAppearanceDefinitions, key: keyof Pick<ArmorAppearanceDefinitions, 'Skin1'>) {
  if (!item?.[key]) {
    return null
  }
  return normalizeUri(`/armorappearances/${item.ItemID}-${key}.glb`)
}

export function weaponAppearanceModelUri(item: WeaponAppearanceDefinitions, key: keyof Pick<WeaponAppearanceDefinitions, 'SkinOverride1' | 'SkinOverride2' | 'MeshOverride'>) {
  if (!item?.[key]) {
    return null
  }
  return normalizeUri(`/weaponappearances/${item.WeaponAppearanceID}-${key}.glb`)
}

export function weaponItemModelUri(item: WeaponItemDefinitions, key: keyof Pick<WeaponItemDefinitions, 'SkinOverride1' | 'SkinOverride2' | 'MeshOverride'>) {
  if (!item?.[key]) {
    return null
  }
  return normalizeUri(`/weapons/${item.WeaponID}-${key}.glb`)
}

function normalizeUri(uri: string) {
  return uri.toLowerCase()
}
