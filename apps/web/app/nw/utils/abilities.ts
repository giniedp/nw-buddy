import { Ability } from "@nw-data/types";

const WEAPON_TAG_NAME = {
  Sword: 'ui_straightsword',
  Rapier: 'ui_rapier',
  Axe: 'ui_hatchet',
  Spear: 'ui_spear',
  GreatAxe: 'ui_greataxe',
  Warhammer:'ui_warhammer',
  Greatsword:'ui_greatsword',
  Rifle: 'ui_musket',
  Bow: 'ui_bow',
  Blunderbuss: 'ui_blunderbuss',
  Fire: 'ui_firestaff',
  Heal: 'ui_lifestaff',
  Ice: 'ui_icemagic',
  VoidGauntlet: 'ui_voidmagic',
}

export function getAbilityCategoryTag(ability: Ability) {
  return ability?.UICategory?.match(/(heal|melee|debuff|buff|range|magic|passive)/i)?.[0]?.toLowerCase() as any || 'none'
}

export function getWeapontagName(ability: Ability) {
  return WEAPON_TAG_NAME[ability?.WeaponTag]
}

