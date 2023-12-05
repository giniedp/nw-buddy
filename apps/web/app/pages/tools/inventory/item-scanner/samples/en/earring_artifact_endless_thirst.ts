import type { ScanSample } from '../../types'

export default {
  file: 'earring_artifact_endless_thirst.png',
  itemClass: ['EquippableToken'],
  scan: {
    name: 'Endless Thirst',
    type: null, // 'Earring',
    rarity: null, // 'Artifact',
    gearScore: null, // 700,
    attributes: ['Magnify'],
    perks: ['The Thirst', 'Physical Ward IV', 'Empowering Toast', 'Fortifying Toast'],
  },
  instance: {
    itemId: 'Artifact_Set1_Earring1',
    gearScore: 700,
    perks: {
      Perk2: 'PerkID_Gem_PhysicalWard4',
      PerkBucket5: 'PerkID_Earring_HealthOnPotion',
    },
  },
} satisfies ScanSample
