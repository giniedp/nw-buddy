import { Ability } from "@nw-data/types";

export function getAbilityCategoryTag(ability: Ability) {
  return ability?.UICategory?.match(/(heal|melee|debuff|buff|range|magic|passive)/i)?.[0]?.toLowerCase() as any || 'none'
}
