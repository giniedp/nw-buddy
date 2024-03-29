import { ItemClass } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface TransmogCategory {
  id: string
  name: string
  itemClass: ItemClass[]
  subcategories: ItemClass[]
}

export const TRANSMOG_CATEGORIES: TransmogCategory[] = [
  {
    id: '1handed',
    name: 'categorydata_1handed',
    itemClass: ['EquippableMainHand', 'Melee'],
    subcategories: ['Sword', 'Rapier', 'Hatchet', 'Flail'],
  },
  {
    id: '2handed',
    name: 'categorydata_2handed',
    itemClass: ['EquippableTwoHand', 'Melee'],
    subcategories: ['GreatSword', 'Spear', '2HAxe', '2HHammer'],
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
    itemClass: ['EquippableMainHand', 'Magic'],
    subcategories: ['FireStaff', 'LifeStaff', 'IceMagic', 'VoidGauntlet'],
  },
  {
    id: 'shields',
    name: 'categorydata_shields',
    itemClass: ['EquippableOffHand', 'Shield'],
    subcategories: ['KiteShield', 'RoundShield', 'TowerShield'],
  },
  {
    id: 'slothead',
    name: 'categorydata_slothead',
    itemClass: ['EquippableHead'],
    subcategories: ['Heavy', 'Medium', 'Light'],
  },
  {
    id: 'slotchest',
    name: 'categorydata_slotchest',
    itemClass: ['EquippableChest'],
    subcategories: ['Heavy', 'Medium', 'Light'],
  },
  {
    id: 'slothands',
    name: 'categorydata_slothands',
    itemClass: ['EquippableHands'],
    subcategories: ['Heavy', 'Medium', 'Light'],
  },
  {
    id: 'slotlegs',
    name: 'categorydata_slotlegs',
    itemClass: ['EquippableLegs'],
    subcategories: ['Heavy', 'Medium', 'Light'],
  },
  {
    id: 'slotfeet',
    name: 'categorydata_slotfeet',
    itemClass: ['EquippableFeet'],
    subcategories: ['Heavy', 'Medium', 'Light'],
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
      'AzothStaff',
      'InstrumentFlute',
      'InstrumentGuitar',
      'InstrumentMandolin',
      'InstrumentUprightBass',
      'InstrumentDrums',
    ],
  },
]

export function getAppearanceCategory(appearance: { ItemClass?: string[] }) {
  return TRANSMOG_CATEGORIES.find((category) => isAppearanceInTransmogCategory(appearance, category))
}

export function isAppearanceInTransmogCategory(appearance: { ItemClass?: string[] }, category: TransmogCategory) {
  if (!category?.itemClass?.length || !appearance?.ItemClass?.length) {
    return false
  }
  return category.itemClass.every((a) => appearance.ItemClass.some((b) => eqCaseInsensitive(a, b))) || false
}

export function categorizeAppearance(appearance: { ItemClass?: string[] }, categories: TransmogCategory[]) {
  const category = categories.find((category) => isAppearanceInTransmogCategory(appearance, category))
  const subcategory = category?.subcategories.find((it) => {
    return appearance.ItemClass.some((it2) => eqCaseInsensitive(it, it2))
  })
  return {
    category: category?.id,
    subcategory: subcategory,
  }
}

export function getTransmogCategory(id: string) {
  return TRANSMOG_CATEGORIES.find((it) => it.id === id)
}
