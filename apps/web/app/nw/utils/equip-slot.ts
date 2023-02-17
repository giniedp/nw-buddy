export type EquipSlotId =
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'weapon1'
  | 'weapon2'
  | 'weapon3'
  | 'amulet'
  | 'ring'
  | 'earring'
  | 'heartgem'
  | 'quickslot1'
  | 'quickslot2'
  | 'quickslot3'
  | 'quickslot4'
  | 'buff1'
  | 'buff2'
  | 'buff3'
  | 'buff4'
  | 'trophy1'
  | 'trophy2'
  | 'trophy3'
  | 'trophy4'
  | 'trophy5'
  | 'trophy6'
  | 'trophy7'
  | 'trophy8'
  | 'trophy9'
  | 'trophy10'
  | 'trophy11'
  | 'trophy12'
  | 'trophy13'
  | 'trophy14'
  | 'trophy15'
  | 'arrow'
  | 'cartridge'

export interface EquipSlot {
  id: EquipSlotId
  icon: string
  iconSlot: string
  name: string
  itemType: EquipSlotItemType
}

export type EquipSlotItemType =
  | 'EquippableHead'
  | 'EquippableChest'
  | 'EquippableHands'
  | 'EquippableLegs'
  | 'EquippableFeet'
  | 'EquippableAmulet'
  | 'EquippableRing'
  | 'EquippableToken'
  | 'Weapon'
  | 'Shield'
  | 'HeartGem'
  | 'Consumable'
  | 'Ammo'
  | 'Trophies'

export const EQUIP_SLOTS: Array<EquipSlot> = [
  {
    id: 'head',
    icon: 'assets/icons/slots/lightheada.png',
    iconSlot: 'assets/icons/slots/iconhead.png',
    name: 'ui_itemtypedescription_head_slot',
    itemType: 'EquippableHead',
  },
  {
    id: 'chest',
    icon: 'assets/icons/slots/lightchesta.png',
    iconSlot: 'assets/icons/slots/iconchest.png',
    name: 'ui_itemtypedescription_chest_slot',
    itemType: 'EquippableChest',
  },
  {
    id: 'hands',
    icon: 'assets/icons/slots/lighthandsa.png',
    iconSlot: 'assets/icons/slots/iconhand.png',
    name: 'ui_itemtypedescription_hands_slot',
    itemType: 'EquippableHands',
  },
  {
    id: 'legs',
    icon: 'assets/icons/slots/lightlegsa.png',
    iconSlot: 'assets/icons/slots/iconlegs.png',
    name: 'ui_itemtypedescription_legs_slot',
    itemType: 'EquippableLegs',
  },
  {
    id: 'feet',
    icon: 'assets/icons/slots/lightfeeta.png',
    iconSlot: 'assets/icons/slots/iconfeet.png',
    name: 'ui_itemtypedescription_feet_slot',
    itemType: 'EquippableFeet',
  },
  {
    id: 'amulet',
    icon: 'assets/icons/slots/trinketp.png',
    iconSlot: 'assets/icons/slots/iconamulet.png',
    name: 'ui_amulet_slot_tooltip',
    itemType: 'EquippableAmulet',
  },
  {
    id: 'ring',
    icon: 'assets/icons/slots/trinketa.png',
    iconSlot: 'assets/icons/slots/iconring.png',
    name: 'ui_ring_slot_tooltip',
    itemType: 'EquippableRing',
  },
  {
    id: 'earring',
    icon: 'assets/icons/slots/trinkete.png',
    iconSlot: 'assets/icons/slots/icontoken.png',
    name: 'ui_unlock_token_slot',
    itemType: 'EquippableToken',
  },
  {
    id: 'weapon1',
    icon: 'assets/icons/slots/weapon.png',
    iconSlot: 'assets/icons/slots/iconweapon.png',
    name: 'ui_weapon1',
    itemType: 'Weapon',
  },
  {
    id: 'weapon2',
    icon: 'assets/icons/slots/weapon.png',
    iconSlot: 'assets/icons/slots/iconweapon.png',
    name: 'ui_weapon2',
    itemType: 'Weapon',
  },
  {
    id: 'weapon3',
    icon: 'assets/icons/slots/1hshieldd.png',
    iconSlot: 'assets/icons/slots/iconshield.png',
    name: 'ui_weapon3',
    itemType: 'Shield',
  },
  {
    id: 'heartgem',
    icon: 'assets/icons/slots/rune.png',
    name: 'ui_itemtypedescription_heartgem_rune',
    iconSlot: 'assets/icons/slots/iconrune.png',
    itemType: 'HeartGem',
  },

  {
    id: 'buff1',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot1',
    itemType: 'Consumable',
  },
  {
    id: 'buff2',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot2',
    itemType: 'Consumable',
  },
  {
    id: 'buff3',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot3',
    itemType: 'Consumable',
  },
  {
    id: 'buff4',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
  },

  {
    id: 'quickslot1',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot1',
    itemType: 'Consumable',
  },
  {
    id: 'quickslot2',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot2',
    itemType: 'Consumable',
  },
  {
    id: 'quickslot3',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot3',
    itemType: 'Consumable',
  },
  {
    id: 'quickslot4',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
  },

  {
    id: 'arrow',
    icon: 'assets/icons/slots/iconarrow.png',
    iconSlot: 'assets/icons/slots/iconarrow.png',
    name: '',
    itemType: 'Ammo',
  },
  {
    id: 'cartridge',
    icon: 'assets/icons/slots/iconcartridges.png',
    iconSlot: 'assets/icons/slots/iconcartridges.png',
    name: '',
    itemType: 'Ammo',
  },

  {
    id: 'trophy1',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy2',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy3',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy4',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy5',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },

  {
    id: 'trophy6',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy7',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy8',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy9',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy10',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },

  {
    id: 'trophy11',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy12',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy13',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy14',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
  {
    id: 'trophy15',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
  },
]

export const NW_GS_WEIGHTS: Partial<Record<EquipSlotId, number>> = {
  head: 0.35 * 0.2,
  chest: 0.35 * 0.35,
  hands: 0.35 * 0.15,
  legs: 0.35 * 0.2,
  feet: 0.35 * 0.1,
  weapon1: 0.45 * 0.5,
  weapon2: 0.45 * 0.5,
  amulet: 0.2 / 3,
  ring: 0.2 / 3,
  earring: 0.2 / 3,
}

export function gearScoreRelevantSlots(): Array<EquipSlot & { weight: number }> {
  return EQUIP_SLOTS.map((slot) => {
    return {
      ...slot,
      weight: NW_GS_WEIGHTS[slot.id] || 0,
    }
  }).filter((it) => !!it.weight)
}

export function totalGearScore(equip: Array<{ id: EquipSlotId; gearScore: number }>) {
  let result = 0
  for (const slot of equip) {
    result += slot.gearScore * (NW_GS_WEIGHTS[slot.id] || 0)
  }
  return result
}
