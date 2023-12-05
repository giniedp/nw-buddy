import type { ScanSample } from '../../types'

export default {
  file: 'hatchet_thunders_charge_str_con.png',
  itemClass: ['Hatchet'],
  scan: {
    name: "hunder's Charge", // 'Thunder\'s Charge',
    type: null, // 'Hatchet',
    rarity: null, // 'Legendary',
    gearScore: null, // 692,
    attributes: ['Strength', 'Constitution'],
    perks: ['Empty Socket', 'Keen', 'Refreshing Torrent', 'Desperate Empower'],
  },
  instance: {
    itemId: '1hThrowingAxeDynastyEliteT5',
    gearScore: 600,
    perks: {
      PerkBucket3: 'PerkID_Gem_EmptyGemSlot',
      PerkBucket1: 'PerkID_Stat_TwoHandBarbarian',
      PerkBucket4: 'PerkID_Weapon_CritChance',
      PerkBucket5: 'PerkID_Ability_Hatchet_RagingTorrent',
      PerkBucket2: 'PerkID_Weapon_OnExhaustDmg',
    },
  },
} satisfies ScanSample
