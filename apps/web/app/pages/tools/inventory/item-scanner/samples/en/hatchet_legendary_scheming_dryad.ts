import type { ScanSample } from '../../types'

export default {
  file: 'hatchet_legendary_scheming_dryad.png',
  itemClass: ['Hatchet'],
  scan: {
    name: 'Scheming Dryad Hatchet',
    type: null, // 'Hatchet',
    rarity: null, // 'Legendary',
    gearScore: null, // 692,
    attributes: ['Strength'],
    perks: ['Gambit IV', 'Vicious', 'Shirking Arcane', 'Keen Berserk'],
  },
  instance: {
    itemId: '1hThrowingAxeAngryEarthArenaT5',
    gearScore: 600,
    perks: {
      Perk2: 'PerkID_Gem_GambitGem4',
      PerkBucket1: 'PerkID_Stat_TwoHandSoldier',
      PerkBucket4: 'PerkID_Weapon_DmgCrit',
      PerkBucket5: 'PerkID_Weapon_DodgeSuccess_ArcaneDMG',
      PerkBucket3: 'PerkID_Ability_Hatchet_Berserk',
    },
  },
} satisfies ScanSample
