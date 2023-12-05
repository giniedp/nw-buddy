import type { ScanSample } from '../../types'

export default {
  file: 'blunderbuss_legendary_named_warhorn.png',
  itemClass: ['Blunderbuss'],
  scan: {
    name: 'Warhorn',
    type: null, // 'Blunderbuss',
    rarity: null, // 'Legendary',
    gearScore: null, // 692,
    attributes: ['Strength'],
    perks: ['Gambit IV', 'Vicious', 'Mortal Power', 'Keenly Jagged'],
  },
  instance: {
    itemId: '2hBlunderbuss_Warhorn',
    gearScore: 700,
    perks: {
      Perk3: 'PerkID_Gem_GambitGem4',
      PerkBucket5: 'PerkID_Weapon_DmgCrit',
    },
  },
} satisfies ScanSample
