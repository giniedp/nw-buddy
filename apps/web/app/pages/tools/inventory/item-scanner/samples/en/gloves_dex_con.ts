import type { ScanSample } from '../../types'

export default {
  file: 'gloves_dex_con.png',
  itemClass: ['EquippableHands'],
  scan: {
    name: 'Rescuer Gloves of the Brigand',
    type: 'Medium Glove',
    rarity: 'Legendary',
    gearScore: 700,
    attributes: ['Dexterity', 'Constitution'],
    perks: ['Empty Socket', 'Freedom', 'Leeching Cyclone', 'Void Harnessing'],
  },
  instance: {
    itemId: 'MediumHands_RescuerT5',
    gearScore: 700,
    perks: {
      PerkBucket3: 'PerkID_Gem_EmptyGemSlot',
      PerkBucket1: 'PerkID_Stat_ArmorBrigand',
      PerkBucket2: 'PerkID_Armor_DurCC',
      PerkBucket4: 'PerkID_Ability_Spear_Cyclone',
      PerkBucket5: 'PerkID_Armor_DmgVoid',
    },
  },
} satisfies ScanSample
