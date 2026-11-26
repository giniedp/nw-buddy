import type { ScannedEquipSocket, ScannedEquipType } from '@nw-data/generated'

/**
 * The socket of a weapon by its equip type: the entry of the hand, the other hand's when the type has none for it (a
 * shield's equip type has no main entries)
 */
export function equipTypeSocket(
  type: ScannedEquipType,
  { offHand, drawn }: { offHand: boolean; drawn: boolean },
): ScannedEquipSocket | null {
  const main = drawn ? type.drawn : type.sheathed
  const off = drawn ? type.offHandDrawn : type.offHandSheathed
  return (offHand ? (off ?? main) : (main ?? off)) ?? null
}
