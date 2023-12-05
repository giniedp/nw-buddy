import type { ScanSample } from '../../types'

export default {
  file: 'rapier_legendary_mythril.png',
  itemClass: ['EquippableMainHand'],
  scan: {
    name: 'Arboreal Mythril Rapier ofthe Sage', // 'Arboreal Mythril Rapier of the Sage',
    type: 'Rapier',
    rarity: 'Legendary',
    gearScore: null, // 700,
    attributes: ['Focus'],
    perks: ['Arboreal IV', 'Keen Speed', 'Keen', 'Refreshing Fleche'],
  },
  instance: {
    itemId: 'Scarab_Con_RapierT52',
    gearScore: 700,
    perks: {
      PerkBucket2: 'PerkID_Gem_NatureDMG4',
      Perk1: 'PerkID_Stat_TwoHandSage',
      PerkBucket3: 'PerkID_Weapon_HasteOnCrit',
      PerkBucket4: 'PerkID_Weapon_CritChance',
      PerkBucket5: 'PerkID_Ability_Rapier_Fleche',
    },
  },
} satisfies ScanSample
