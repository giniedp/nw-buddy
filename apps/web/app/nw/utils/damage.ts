import { ItemdefinitionsRunes, ItemdefinitionsWeapons, WeaponTag } from '@nw-data/types'
import type { AttributeRef } from '../attributes/nw-attributes'

export function damageFactorForLevel(level: number) {
  return 0.025 * (level - 1)
}

export function damageFactorForGS(gearScore: number) {
  const powerLow = Math.floor((Math.min(500, Math.max(gearScore, 100)) - 100) / 5)
  const powerHigh = Math.floor((Math.max(gearScore, 500) - 500) / 5)

  const factorLow = Math.pow(1 + 0.0112, powerLow)
  const factorHigh = Math.pow(1 + 0.6667 * 0.0112, powerHigh)

  return factorLow * factorHigh
}

export function damageFactorForAttrs({
  weapon,
  attrSums,
}: {
  weapon: ItemdefinitionsWeapons | ItemdefinitionsRunes
  attrSums: Record<AttributeRef, number>
}) {
  const str = attrSums.str * (weapon?.ScalingStrength || 0)
  const dex = attrSums.dex * (weapon?.ScalingDexterity || 0)
  const int = attrSums.int * (weapon?.ScalingIntelligence || 0)
  const foc = attrSums.foc * (weapon?.ScalingFocus || 0)
  return str + dex + int + foc
}

const WEAPON_COEF_FOR_TIP = {
  Heal: 1.07,
  Greatsword: 0.9,
  Blunderbuss: 1.38, // 6 x 0.23
}

export function damageCoefForWeaponTag(tag: string) {
  return WEAPON_COEF_FOR_TIP[tag] || 1
}

export function damageForTooltip({
  playerLevel,
  gearScore,
  weapon,
  attrSums,
}: {
  playerLevel: number
  gearScore: number
  weapon: ItemdefinitionsWeapons
  attrSums: Record<AttributeRef, number>
}) {
  return (
    weapon.BaseDamage *
    damageCoefForWeaponTag(getWeaponTagFromWeapon(weapon)) *
    damageFactorForGS(gearScore) *
    (1 +
      damageFactorForLevel(playerLevel) +
      damageFactorForAttrs({
        weapon: weapon,
        attrSums: attrSums,
      }))
  )
}

const WEAPON_EFFECT_TO_TAG: Record<string, WeaponTag> = {
  Axe: 'Axe',
  Blunderbuss: 'Blunderbuss',
  Bow: 'Bow',
  Fire: 'Fire',
  FireStaff: 'Fire',
  GreatAxe: 'GreatAxe',
  Greatsword: 'Greatsword',
  GreatSword: 'Greatsword',
  Hatchet: 'Axe',
  Heal: 'Heal',
  Ice: 'Ice',
  IceGauntlet: 'Ice',
  LifeStaff: 'Heal',
  Musket: 'Rifle',
  Rapier: 'Rapier',
  Rifle: 'Rifle',
  Spear: 'Spear',
  Sword: 'Sword',
  VoidGauntlet: 'VoidGauntlet',
  Warhammer: 'Warhammer',
}

export function getWeaponTagFromWeapon(item: ItemdefinitionsWeapons | null): WeaponTag | null {
  return WEAPON_EFFECT_TO_TAG[item?.WeaponEffectId]
}

const WEAPON_TAG_TO_AMMO_TYPE: Partial<Record<WeaponTag, string>> = {
  Bow: 'Arrow',
  Blunderbuss: 'Shot',
  Rifle: 'Shot',
}

export function getAmmoTypeFromWeaponTag(weaponTag: WeaponTag) {
  return WEAPON_TAG_TO_AMMO_TYPE[weaponTag]
}
