import type { ScanSample } from '../../types'

export default {
  file: 'instrumentalitys_earring.png',
  itemClass: ['EquippableToken'],
  scan: {
    name: "nstrumentality's Earring", // 'Instrumentality\'s Earring',
    type: 'Earring',
    rarity: 'Legendary',
    gearScore: null, // 700,
    attributes: ['Strength'],
    perks: ['Abyssal Ward IV', 'Refreshing', 'Refreshing Toast', 'Healing Heart'],
  },
  instance: {
    itemId: 'FLXpac_EarringT5_LI_Mut_Fixed',
    gearScore: 700,
    perks: {
      Perk3: 'PerkID_Gem_AbyssalWard4',
      PerkBucket2: 'PerkID_Stat_ArmorSoldier',
      PerkBucket5: 'PerkID_Earring_PotionCDR',
    },
  },
} satisfies ScanSample
