import { ItemdefinitionsRunes, ItemdefinitionsWeapons, WeaponTag } from '@nw-data/types'
import type { AttributeRef } from '../attributes/nw-attributes'

export function damageFactorForLevel(level: number) {
  // taken from 'playerbaseattributes.pbadb'
  const levelScaling = 0.025 //  PlayerBaseAttributes['player attribute data']['level damage multiplier']
  return levelScaling * (level - 1)
}

export function damageFactorForGS(gearScore: number) {
  // taken from 'playerbaseattributes.pbadb'
  const gsMin = 100 // PBA['player attribute data']['min possible weapon gear score']
  const gsMax = 500 // PBA['player attribute data']['diminishing gear score threshold']
  const gsRounding = 5 // PBA['player attribute data']['gear score rounding interval']
  const baseDamageCompund = 0.0112 // PBA['player attribute data']['base damage compound increase']
  const compoundDiminishingMulti = 0.6667 // PBA['player attribute data']['compound increase diminishing multiplier']

  const powerLow = Math.floor((Math.min(gsMax, Math.max(gearScore, gsMin)) - gsMin) / gsRounding)
  const powerHigh = Math.floor((Math.max(gearScore, gsMax) - gsMax) / gsRounding)

  const factorLow = Math.pow(1 + baseDamageCompund, powerLow)
  const factorHigh = Math.pow(1 + baseDamageCompund * compoundDiminishingMulti, powerHigh)

  return factorLow * factorHigh
}

export function damageFactorForAttrs({
  weapon,
  attrSums,
}: {
  weapon: Pick<ItemdefinitionsWeapons | ItemdefinitionsRunes, 'ScalingDexterity' | 'ScalingFocus' | 'ScalingIntelligence' | 'ScalingStrength'>
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
