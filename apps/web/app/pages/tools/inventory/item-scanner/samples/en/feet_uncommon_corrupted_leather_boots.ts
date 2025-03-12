import type { ScanSample } from '../../types'

export default {
  file: 'feet_uncommon_corrupted_leather_boots.png',
  itemClass: ['EquippableFeet'],
  scan: {
    name: 'Corrupted Leather Boots',
    type: 'Medium Footwear',
    rarity: 'Uncommon',
    gearScore: 660,
    attributes: ['Intelligence'],
    perks: ['Grit Ward'],
  },
  instance: {
    itemId: 'MediumFeet_CorruptedElite1T5', // 'MediumFeet_CorruptedElite1T4',
    gearScore: 660,
    perks: {
      PerkBucket1: 'PerkID_Stat_ArmorScholar',
      PerkBucket4: 'PerkID_Armor_DefGrit',
    },
  },
} satisfies ScanSample
