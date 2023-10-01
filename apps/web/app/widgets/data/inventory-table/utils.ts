import { ItemClass } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface InventoryCategory {
  id: string
  name: string
  itemClass: ItemClass[]
  subcategories: ItemClass[]
}

export const INVENTORY_CATEOGRIES: InventoryCategory[] = [
  {
    id: '1handed',
    name: 'categorydata_1handed',
    itemClass: ['EquippableMainHand', 'Melee'],
    subcategories: ['Sword', 'Rapier', 'Hatchet'],
  },
  {
    id: '2handed',
    name: 'categorydata_2handed',
    itemClass: ['EquippableTwoHand', 'Melee'],
    subcategories: ['GreatSword', 'Spear', '2hAxe', '2HHammer'],
  },
  {
    id: 'rangedweapons',
    name: 'categorydata_rangedweapons',
    itemClass: ['EquippableTwoHand', 'Ranged'],
    subcategories: ['Bow', 'Musket', 'Blunderbuss'],
  },
  {
    id: 'magical',
    name: 'categorydata_magical',
    itemClass: ['EquippableMainHand', 'Magic' as any], // TODO: fix type
    subcategories: ['FireStaff', 'LifeStaff', 'IceMagic', 'VoidGauntlet'],
  },
  {
    id: 'shields',
    name: 'categorydata_shields',
    itemClass: ['EquippableOffHand' as any, 'Shield'],
    subcategories: ['KiteShield', 'RoundShield', 'TowerShield'],
  },
  {
    id: 'slothead',
    name: 'categorydata_slothead',
    itemClass: ['EquippableHead'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotchest',
    name: 'categorydata_slotchest',
    itemClass: ['EquippableChest'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slothands',
    name: 'categorydata_slothands',
    itemClass: ['EquippableHands'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotlegs',
    name: 'categorydata_slotlegs',
    itemClass: ['EquippableLegs'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'slotfeet',
    name: 'categorydata_slotfeet',
    itemClass: ['EquippableFeet'],
    subcategories: ['Heavy', 'Medium', 'Light'] as any,
  },
  {
    id: 'tools',
    name: 'categorydata_tools',
    itemClass: ['EquippableTool'],
    subcategories: [
      'LoggingAxe',
      'FishingPole',
      'PickAxe',
      'Sickle',
      'SkinningKnife',
      'AzothStaff' as any,
      'InstrumentFlute',
      'InstrumentGuitar',
      'InstrumentMandolin',
      'InstrumentUprightBass',
      'InstrumentDrums',
    ],
  },
  {
    id: 'consumables',
    name: 'categorydata_tools',
    itemClass: ['Consumable' as any],
    subcategories: ['Food', 'RawFood', 'Potion', 'WeaponOil'] as any,
  },
  {
    id: 'runes',
    name: 'heartgem_rune',
    itemClass: ['HeartGem' as any],
    subcategories: [] as any,
  },
]

function isItemInCategory(appearance: { ItemClass?: string[] }, category: InventoryCategory) {
  if (!category?.itemClass?.length || !appearance?.ItemClass?.length) {
    return false
  }
  return category.itemClass.every((a) => appearance.ItemClass.some((b) => eqCaseInsensitive(a, b))) || false
}

export function categorizeInventoryItem(appearance: { ItemClass?: string[] }, categories: InventoryCategory[]) {
  const category = categories.find((category) => isItemInCategory(appearance, category))
  const subcategory = category?.subcategories.find((it) => {
    return appearance.ItemClass.some((it2) => eqCaseInsensitive(it, it2))
  })
  return {
    category: category?.id,
    subcategory: subcategory,
  }
}
