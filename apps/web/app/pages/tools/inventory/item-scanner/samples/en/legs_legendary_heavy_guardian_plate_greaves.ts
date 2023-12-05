import type { ScanSample } from '../../types'

export default {
  file: 'legs_legendary_heavy_guardian_plate_greaves.png',
  itemClass: ['EquippableLegs'],
  scan: {
    name: 'Imbued Guardian Plate Greaves of the Sentry',
    type: 'Heavy Legwear',
    rarity: 'Legendary',
    gearScore: null, //690,
    attributes: ['Constitution'],
    perks: ['Elemental Ward IV', 'Freedom', 'Shirking Fortification', 'Thrust Conditioning'],
  },
  instance: {
    itemId: 'HeavyLegs_Dungeon6T5',
    gearScore: 600,
    perks: {
      PerkBucket1: 'PerkID_Stat_ArmorSentry',
      PerkBucket3: 'PerkID_Gem_ElementalWard4',
      PerkBucket4: 'PerkID_Armor_DurCC',
      PerkBucket5: 'PerkID_Armor_DodgeSuccess_Fortify',
      PerkBucket2: 'PerkID_Armor_Conditioning_Thrust',
    },
  },
} satisfies ScanSample
