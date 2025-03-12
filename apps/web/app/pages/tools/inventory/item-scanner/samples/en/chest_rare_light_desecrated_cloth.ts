import type { ScanSample } from '../../types'

export default {
  file: 'chest_rare_light_desecrated_cloth.png',
  itemClass: ['EquippableChest'],
  scan: {
    name: 'Desecrated Clot Shirt', // 'Desecrated Cloth Shirt of the Sentry',
    type: null, // 'Light Chestwear',
    rarity: null, // 'Rare',
    gearScore: 630,
    attributes: ['Constitution'],
    perks: ['Empty Socket', 'Refreshing'],
  },
  instance: {
    itemId: 'LightChest_LostElite1T5',
    gearScore: 630,
    perks: {
      PerkBucket3: 'PerkID_Gem_EmptyGemSlot',
      PerkBucket1: 'PerkID_Stat_ArmorSentry',
      PerkBucket4: 'PerkID_Common_CDR',
    },
  },
} satisfies ScanSample
