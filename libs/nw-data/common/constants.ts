export const NW_MIN_GEAR_SCORE = 100
export const NW_MAX_GEAR_SCORE_UPGRADABLE = 590
export const NW_MAX_GEAR_SCORE_BASE = 600
export const NW_MAX_GEAR_SCORE = 625
export const NW_MAX_CHARACTER_LEVEL = 65
export const NW_MAX_TRADESKILL_LEVEL = 250
export const NW_MAX_WEAPON_LEVEL = 20
export const NW_FALLBACK_ICON = 'assets/icons/iconmodedefault.png'

// from playerbaseattributes.pdadb

export const NW_MIN_ARMOR_MITIGATION = 0
export const NW_MAX_ARMOR_MITIGATION = 2
export const NW_PHYSICAL_ARMOR_SCALE_FACTOR = 1850
export const NW_ELEMENTAL_ARMOR_SCALE_FACTOR = 1850
export const NW_ARMOR_SET_RATING_EXPONENT = 1.2
export const NW_ARMOR_MITIGATION_EXPONENT = 1.2
export const NW_ARMOR_RATING_DECIMAL_ACCURACY = 1
export const NW_BASE_DAMAGE_COMPOUND_INCREASE = 0.0112
export const NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER = 0.6667
export const NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL = 5
export const NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE = 100
export const NW_DIMINISHING_GEAR_SCORE_THRESHOLD = 500
export const NW_ROUND_GEARSCORE_UP = true
export const NW_GEAR_SCORE_ROUNDING_INTERVAL = 5
export const NW_MAX_POINTS_PER_ATTRIBUTE = 500
export const NW_LEVEL_DAMAGE_MULTIPLIER = 0.025
export const NW_ITEM_RARITY_DATA = Object.freeze([
  {
    displayName: '@RarityLevel0_DisplayName',
    maxPerkCount: 0,
  },
  {
    displayName: '@RarityLeve1_DisplayName',
    maxPerkCount: 2,
  },
  {
    displayName: '@RarityLeve2_DisplayName',
    maxPerkCount: 3,
  },
  {
    displayName: '@RarityLeve3_DisplayName',
    maxPerkCount: 4,
  },
  {
    displayName: '@RarityLeve4_DisplayName',
    maxPerkCount: 5,
  },
])
export const NW_PERK_GENERASTION_DATA = Object.freeze([
  {
    maxPerkChannel: 2,
    gemSlotProbability: 0,
    attributePerkProbability: 0,
    generalGearScorePerkCount: [170, 170, 1000],
    craftingGearScorePerkCount: [170, 170, 1000],
    attributePerkBucket: 'CraftingAttributeBucketT2',
  },
  {
    maxPerkChannel: 2,
    gemSlotProbability: 0,
    attributePerkProbability: 0,
    generalGearScorePerkCount: [270, 270, 325, 1000],
    craftingGearScorePerkCount: [270, 270, 325, 1000],
    attributePerkBucket: 'CraftingAttributeBucketT3',
  },
  {
    maxPerkChannel: 3,
    gemSlotProbability: 0,
    attributePerkProbability: 0,
    generalGearScorePerkCount: [370, 370, 370, 450, 1000],
    craftingGearScorePerkCount: [370, 370, 370, 450, 1000],
    attributePerkBucket: 'CraftingAttributeBucketT4',
  },
  {
    maxPerkChannel: 4,
    gemSlotProbability: 0,
    attributePerkProbability: 0,
    generalGearScorePerkCount: [470, 470, 470, 470, 600, 1000],
    craftingGearScorePerkCount: [470, 470, 470, 470, 600, 1000],
    attributePerkBucket: 'CraftingAttributeBucketT5',
  },
])
