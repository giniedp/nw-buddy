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

export function getWeaponTagLabel(value: string) {
  return WEAPON_TAG_NAME[value]
}

export function stripAbilityProperties(item: Ability): Partial<Ability> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'AbilityID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}
