import { ItemClass } from '../generated/types'
import { NW_MAX_CHARACTER_LEVEL } from './constants'

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
  | 'buff5'
  | 'buff6'
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
  | 'bag1'
  | 'bag2'
  | 'bag3'
  | 'tool1'
  | 'tool2'
  | 'tool3'
  | 'tool4'
  | 'tool5'
  | 'instrument1'
  | 'instrument2'
  | 'instrument3'
  | 'instrument4'
  | 'instrument5'

export interface EquipSlot {
  id: EquipSlotId
  icon: string
  iconSlot: string
  name: string
  itemType: EquipSlotItemType
  itemClass: ItemClass[]
  itemClass2?: ItemClass[]
}

export type EquipSlotItemType =
  | Extract<
      ItemClass,
      | 'EquippableHead'
      | 'EquippableChest'
      | 'EquippableHands'
      | 'EquippableLegs'
      | 'EquippableFeet'
      | 'EquippableAmulet'
      | 'EquippableRing'
      | 'EquippableToken'
      | 'EquippableTool'
      | 'Weapon'
      | 'Shield'
      | 'HeartGem'
      | 'Consumable'
      | 'Ammo'
      | 'Bag'
    >
  | 'Trophies'

export function getEquipSlotForId(id: EquipSlotId): EquipSlot {
  const found = EQUIP_SLOTS.find((it) => it.id === id)
  return found ? { ...found } : null
}

export const EQUIP_SLOTS: Array<EquipSlot> = [
  {
    id: 'head',
    icon: 'assets/icons/slots/lightheada.png',
    iconSlot: 'assets/icons/slots/iconhead.png',
    name: 'ui_itemtypedescription_head_slot',
    itemType: 'EquippableHead',
    itemClass: ['Armor', 'EquippableHead'],
  },
  {
    id: 'chest',
    icon: 'assets/icons/slots/lightchesta.png',
    iconSlot: 'assets/icons/slots/iconchest.png',
    name: 'ui_itemtypedescription_chest_slot',
    itemType: 'EquippableChest',
    itemClass: ['Armor', 'EquippableChest'],
  },
  {
    id: 'hands',
    icon: 'assets/icons/slots/lighthandsa.png',
    iconSlot: 'assets/icons/slots/iconhand.png',
    name: 'ui_itemtypedescription_hands_slot',
    itemType: 'EquippableHands',
    itemClass: ['Armor', 'EquippableHands'],
  },
  {
    id: 'legs',
    icon: 'assets/icons/slots/lightlegsa.png',
    iconSlot: 'assets/icons/slots/iconlegs.png',
    name: 'ui_itemtypedescription_legs_slot',
    itemType: 'EquippableLegs',
    itemClass: ['Armor', 'EquippableLegs'],
  },
  {
    id: 'feet',
    icon: 'assets/icons/slots/lightfeeta.png',
    iconSlot: 'assets/icons/slots/iconfeet.png',
    name: 'ui_itemtypedescription_feet_slot',
    itemType: 'EquippableFeet',
    itemClass: ['Armor', 'EquippableFeet'],
  },
  {
    id: 'amulet',
    icon: 'assets/icons/slots/trinketp.png',
    iconSlot: 'assets/icons/slots/iconamulet.png',
    name: 'ui_amulet_slot_tooltip',
    itemType: 'EquippableAmulet',
    itemClass: ['Jewelry', 'EquippableAmulet'],
  },
  {
    id: 'ring',
    icon: 'assets/icons/slots/trinketa.png',
    iconSlot: 'assets/icons/slots/iconring.png',
    name: 'ui_ring_slot_tooltip',
    itemType: 'EquippableRing',
    itemClass: ['Jewelry', 'EquippableRing'],
  },
  {
    id: 'earring',
    icon: 'assets/icons/slots/trinkete.png',
    iconSlot: 'assets/icons/slots/icontoken.png',
    name: 'ui_unlock_token_slot',
    itemType: 'EquippableToken',
    itemClass: ['Jewelry', 'EquippableToken'],
  },
  {
    id: 'weapon1',
    icon: 'assets/icons/slots/weapon.png',
    iconSlot: 'assets/icons/slots/iconweapon.png',
    name: 'ui_weapon1',
    itemType: 'Weapon',
    itemClass: ['Weapon', 'EquippableMainHand'],
    itemClass2: ['Weapon', 'EquippableTwoHand'],
  },
  {
    id: 'weapon2',
    icon: 'assets/icons/slots/weapon.png',
    iconSlot: 'assets/icons/slots/iconweapon.png',
    name: 'ui_weapon2',
    itemType: 'Weapon',
    itemClass: ['Weapon', 'EquippableMainHand'],
    itemClass2: ['Weapon', 'EquippableTwoHand'],
  },
  {
    id: 'weapon3',
    icon: 'assets/icons/slots/1hshieldd.png',
    iconSlot: 'assets/icons/slots/iconshield.png',
    name: 'ui_weapon3',
    itemType: 'Shield',
    itemClass: ['Weapon', 'EquippableOffHand', 'Shield'],
  },
  {
    id: 'heartgem',
    icon: 'assets/icons/slots/rune.png',
    name: 'ui_itemtypedescription_heartgem_rune',
    iconSlot: 'assets/icons/slots/iconrune.png',
    itemType: 'HeartGem',
    itemClass: ['HeartGem'],
  },

  {
    id: 'bag1',
    icon: 'assets/icons/slots/iconbag.png',
    iconSlot: 'assets/icons/slots/iconbag.png',
    name: 'ui_itemtypedescription_bag',
    itemType: 'Bag',
    itemClass: ['Bag'],
  },
  {
    id: 'bag2',
    icon: 'assets/icons/slots/iconbag.png',
    iconSlot: 'assets/icons/slots/iconbag.png',
    name: 'ui_itemtypedescription_bag',
    itemType: 'Bag',
    itemClass: ['Bag'],
  },
  {
    id: 'bag3',
    icon: 'assets/icons/slots/iconbag.png',
    iconSlot: 'assets/icons/slots/iconbag.png',
    name: 'ui_itemtypedescription_bag',
    itemType: 'Bag',
    itemClass: ['Bag'],
  },

  {
    id: 'tool1',
    icon: 'assets/icons/slots/iconlogging.png',
    iconSlot: 'assets/icons/slots/iconlogging.png',
    name: 'ui_axe',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'LoggingAxe'],
  },
  {
    id: 'tool2',
    icon: 'assets/icons/slots/iconpickaxe.png',
    iconSlot: 'assets/icons/slots/iconpickaxe.png',
    name: 'ui_pickaxe',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'PickAxe'],
  },
  {
    id: 'tool3',
    icon: 'assets/icons/slots/iconskinning.png',
    iconSlot: 'assets/icons/slots/iconskinning.png',
    name: 'ui_skinningknife',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'SkinningKnife'],
  },
  {
    id: 'tool4',
    icon: 'assets/icons/slots/iconsickle.png',
    iconSlot: 'assets/icons/slots/iconsickle.png',
    name: 'ui_sickle',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'Sickle'],
  },
  {
    id: 'tool5',
    icon: 'assets/icons/slots/iconfishing.png',
    iconSlot: 'assets/icons/slots/iconfishing.png',
    name: 'ui_fishingpole',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'FishingPole'],
  },

  {
    id: 'instrument1',
    icon: 'assets/icons/slots/iconguitar.png',
    iconSlot: 'assets/icons/slots/iconguitar.png',
    name: 'ui_instrument-guitar-slot_name',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'InstrumentGuitar'],
  },
  {
    id: 'instrument2',
    icon: 'assets/icons/slots/iconflute.png',
    iconSlot: 'assets/icons/slots/iconflute.png',
    name: 'ui_instrument-flute-slot_name',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'InstrumentFlute'],
  },
  {
    id: 'instrument3',
    icon: 'assets/icons/slots/iconmandolin.png',
    iconSlot: 'assets/icons/slots/iconmandolin.png',
    name: 'ui_instrument-mandolin-slot_name',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'InstrumentMandolin'],
  },
  {
    id: 'instrument4',
    icon: 'assets/icons/slots/iconbass.png',
    iconSlot: 'assets/icons/slots/iconbass.png',
    name: 'ui_instrument-uprightbass-slot_name',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'InstrumentUprightBass'],
  },
  {
    id: 'instrument5',
    icon: 'assets/icons/slots/icondrums.png',
    iconSlot: 'assets/icons/slots/icondrums.png',
    name: 'ui_instrument-drums-slot_name',
    itemType: 'EquippableTool',
    itemClass: ['EquippableTool', 'InstrumentDrums'],
  },

  {
    id: 'buff1',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot1',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'buff2',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot2',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'buff3',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot3',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'buff4',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'buff5',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'buff6',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },

  {
    id: 'quickslot1',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot1',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'quickslot2',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot2',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'quickslot3',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot3',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },
  {
    id: 'quickslot4',
    icon: 'assets/icons/slots/iconquickslot.png',
    iconSlot: 'assets/icons/slots/iconquickslot.png',
    name: 'ui_quickslot4',
    itemType: 'Consumable',
    itemClass: ['Consumable'],
  },

  {
    id: 'arrow',
    icon: 'assets/icons/slots/iconarrow.png',
    iconSlot: 'assets/icons/slots/iconarrow.png',
    name: '',
    itemType: 'Ammo',
    itemClass: ['Ammo'],
  },
  {
    id: 'cartridge',
    icon: 'assets/icons/slots/iconcartridges.png',
    iconSlot: 'assets/icons/slots/iconcartridges.png',
    name: '',
    itemType: 'Ammo',
    itemClass: ['Ammo'],
  },

  {
    id: 'trophy1',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy2',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy3',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy4',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy5',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },

  {
    id: 'trophy6',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy7',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy8',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy9',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy10',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },

  {
    id: 'trophy11',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy12',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy13',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy14',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
  {
    id: 'trophy15',
    icon: 'assets/icons/slots/icon_housing_category_trophies.png',
    iconSlot: 'assets/icons/slots/icon_housing_category_trophies.png',
    name: 'ui_housing_trophy_buff',
    itemType: 'Trophies',
    itemClass: [],
  },
]

interface GearScoreGroup {
  weight: number
  slots: GearScoreSlot[]
}
interface GearScoreSlot {
  id: EquipSlotId
  weight?: number
  unlockLevel?: number
  minGsPerLevel?: number
  useMinGsUntil?: number
}

const GS_GROUPS: GearScoreGroup[] = [
  {
    weight: 0.45,
    slots: [
      { id: 'head', weight: 0.2 },
      { id: 'chest', weight: 0.35 },
      { id: 'hands', weight: 0.15 },
      { id: 'legs', weight: 0.2 },
      { id: 'feet', weight: 0.1 },
    ],
  },
  {
    weight: 0.35,
    slots: [
      { id: 'weapon1', weight: 0.5, minGsPerLevel: 7 },
      { id: 'weapon2', weight: 0.5, minGsPerLevel: 7 },
    ],
  },
  {
    weight: 0.2,
    slots: [
      { id: 'amulet', unlockLevel: 0 },
      { id: 'ring', unlockLevel: 20 },
      { id: 'earring', unlockLevel: 40 },
    ],
  },
]
export type EquipSlotIdForGS = Extract<
  EquipSlotId,
  'head' | 'chest' | 'hands' | 'legs' | 'feet' | 'weapon1' | 'weapon2' | 'amulet' | 'ring' | 'earring'
>

const NW_GS_WEIGHTS: Record<EquipSlotIdForGS, number> = {
  head: 0.45 * 0.2,
  chest: 0.45 * 0.35,
  hands: 0.45 * 0.15,
  legs: 0.45 * 0.2,
  feet: 0.45 * 0.1,
  weapon1: 0.35 * 0.5,
  weapon2: 0.35 * 0.5,
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

export function getAverageGearScore(
  equip: Array<{ id: EquipSlotId; gearScore: number }>,
  playerLevel = NW_MAX_CHARACTER_LEVEL,
) {
  let result = 0
  for (let { slots, weight } of GS_GROUPS) {
    const hasLockSlots = slots.some((it) => it.unlockLevel)
    if (hasLockSlots) {
      slots = slots.filter((it) => !it.unlockLevel || playerLevel >= it.unlockLevel)
      weight = weight / slots.length
    }
    for (const slot of slots) {
      const foundGs = equip.find((it) => it.id === slot.id)?.gearScore || 0
      const minGs = slot.minGsPerLevel ? slot.minGsPerLevel * playerLevel : 0
      const useGs = Math.max(minGs, foundGs)
      if (!useGs) {
        continue
      }
      if (slot.weight) {
        result += useGs * weight * slot.weight
      } else {
        result += useGs * weight
      }
    }
  }
  return result
}
