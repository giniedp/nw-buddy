import type { ScanSample } from '../../types'

export default {
  file: 'ring_legendary_named_heart_of_anhurawak.png',
  itemClass: ['Jewelry'],
  scan: {
    name: 'Heart of Anhurawak',
    type: 'Ring',
    rarity: 'Legendary',
    gearScore: null, // 625,
    attributes: ['Dexterity'],
    perks: ['Fire Ward IV', 'Thrust Damage', 'Keen Awareness', 'Blood Letting'],
  },
  instance: {
    itemId: 'RingT5_HeartOfAnhurawak',
    gearScore: 600, // 625
    perks: {
      Perk2: 'PerkID_Gem_FireWard4',
    },
  },
} satisfies ScanSample
