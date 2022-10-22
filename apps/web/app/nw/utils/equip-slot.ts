export type EquipSlotId = 'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'weapon1' | 'weapon2' | 'weapon3' | 'amulet' | 'ring' | 'earring' | 'heartgem'
export interface EquipSlot {
  id: EquipSlotId
  icon: string
  name: string
  itemType: string
}

export const EQUIP_SLOTS: Array<EquipSlot> = [
  {
    id: 'head',
    icon: 'assets/icons/slots/lightheada.png',
    name: 'ui_itemtypedescription_head_slot',
    itemType: 'EquippableHead',
  },
  {
    id: 'chest',
    icon: 'assets/icons/slots/lightchesta.png',
    name: 'ui_itemtypedescription_chest_slot',
    itemType: 'EquippableChest',
  },
  {
    id: 'hands',
    icon: 'assets/icons/slots/lighthandsa.png',
    name: 'ui_itemtypedescription_hands_slot',
    itemType: 'EquippableHands',
  },
  {
    id: 'legs',
    icon: 'assets/icons/slots/lightlegsa.png',
    name: 'ui_itemtypedescription_legs_slot',
    itemType: 'EquippableLegs',
  },
  {
    id: 'feet',
    icon: 'assets/icons/slots/lightfeeta.png',
    name: 'ui_itemtypedescription_feet_slot',
    itemType: 'EquippableFeet',
  },
  {
    id: 'weapon1',
    icon: 'assets/icons/slots/weapon.png',
    name: 'ui_weapon1',
    itemType: 'Weapon',
  },
  {
    id: 'weapon2',
    icon: 'assets/icons/slots/weapon.png',
    name: 'ui_weapon2',
    itemType: 'Weapon',
  },
  {
    id: 'weapon3',
    icon: 'assets/icons/slots/1hshieldd.png',
    name: 'ui_weapon3',
    itemType: 'Shield',
  },
  {
    id: 'amulet',
    icon: 'assets/icons/slots/trinketp.png',
    name: 'ui_amulet_slot_tooltip',
    itemType: 'EquippableAmulet',
  },
  {
    id: 'ring',
    icon: 'assets/icons/slots/trinketa.png',
    name: 'ui_ring_slot_tooltip',
    itemType: 'EquippableRing',
  },
  {
    id: 'earring',
    icon: 'assets/icons/slots/trinkete.png',
    name: 'ui_unlock_token_slot',
    itemType: 'EquippableToken',
  },
  {
    id: 'heartgem',
    icon: 'assets/icons/slots/rune.png',
    name: 'ui_itemtypedescription_heartgem_rune',
    itemType: 'HeartGem',
  },
]

const GS_WEIGHTS: Record<EquipSlotId, number> = {
  head: 42,
  chest: 73,
  hands: 31,
  legs: 42,
  feet: 21,
  weapon1: 135,
  weapon2: 135,
  weapon3: 0,
  amulet: 40,
  ring: 40,
  earring: 40,
  heartgem: 0
}

export function totalGearScore(equip: Array<{ id: EquipSlotId, gearScore: number }>) {
  const total = Object.values(GS_WEIGHTS).reduce((a, b) => a + b, 0)
  let result = 0
  for (const slot of equip) {
    result += slot.gearScore * (GS_WEIGHTS[slot.id] || 0) / total
  }
  return result
}
