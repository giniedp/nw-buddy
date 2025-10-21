import {
  svgAxeBattle,
  svgBooks,
  svgBucket,
  svgBurst,
  svgChair,
  svgClipboard,
  svgCode,
  svgCrosshairsSimple,
  svgDatabase,
  svgDiamond,
  svgDiamondOutline,
  svgDice,
  svgDungeon,
  svgFlag,
  svgGlobe,
  svgGrid,
  svgHammer,
  svgHeadSide,
  svgHelmetBattle,
  svgHorseHead,
  svgListCheck,
  svgLocationQuestion,
  svgMap,
  svgMasksTheater,
  svgMusic,
  svgRulerCombined,
  svgRune,
  svgSack,
  svgScrollOld,
  svgShield,
  svgSickle,
  svgSitemap,
  svgSkull,
  svgSkullCow,
  svgSparkles,
  svgSword,
  svgSwords,
  svgTime,
  svgTreasureChest,
  svgTurkey,
  svgUser,
  svgWandSparkles,
  svgWeightHanging,
  svgWheat,
} from './ui/icons/svg'

export interface AppMenuEntry {
  label: string
  path: string
  exact?: boolean
  icon?: string
  svgIcon?: string
  divider?: boolean
}

export interface AppMenuGroup {
  category: string
  label: string
  icon: string
  items: AppMenuEntry[]
}

export const APP_MENU: AppMenuGroup[] = [
  {
    label: 'DB',
    category: 'database',
    icon: svgDatabase,
    items: [
      { label: 'Items', path: '/items', svgIcon: svgGrid },
      { label: 'Housing', path: '/housing', svgIcon: svgChair },
      { label: 'Crafting', path: '/crafting', svgIcon: svgHammer },

      { label: 'Perks', path: '/perks', svgIcon: svgDiamond, divider: true },
      { label: 'Abilities', path: '/abilities', svgIcon: svgCrosshairsSimple },
      { label: 'Status Effects', path: '/status-effects', svgIcon: svgSparkles },
      { label: 'Damage Rows', path: '/damage', svgIcon: svgBurst },
      { label: 'Spells', path: '/spells', svgIcon: svgWandSparkles },
      // { label: 'Armor Types', path: '/armor-definitions', svgIcon: svgHelmetBattle },
      { label: 'Weapon Types', path: '/weapon-definitions', svgIcon: svgSword },

      { label: 'Map', path: '/map', svgIcon: svgMap, divider: true },
      { label: 'Gatherables', path: '/gatherables', svgIcon: svgWheat },
      { label: 'Lore', path: '/lore', svgIcon: svgBooks },
      { label: 'NPCs', path: '/npcs', svgIcon: svgHeadSide },
      { label: 'Quests', path: '/quests', svgIcon: svgLocationQuestion },
      { label: 'Vitals', path: '/vitals', svgIcon: svgSkull },

      { label: 'Loot Limits', path: '/loot-limits', svgIcon: svgTime, divider: true },
      { label: 'Loot Tables', path: '/loot-tables', svgIcon: svgSack },
      { label: 'Loot Buckets', path: '/loot-buckets', svgIcon: svgBucket },
      { label: 'PvP Track Store', path: '/pvp-buckets', svgIcon: svgDice },
      { label: 'Game Events', path: '/game-events', svgIcon: svgClipboard },

      { label: 'Game Modes', path: '/game-modes', svgIcon: svgDungeon, divider: true },
      { label: 'Armor Sets', path: '/armor-sets', svgIcon: svgShield },
      { label: 'Transmog', path: '/transmog', icon: 'assets/icons/menu/transmogtoken.webp' },
      { label: 'Mounts', path: '/mounts', svgIcon: svgHorseHead },

      { label: 'Player Titles', path: '/player-titles', svgIcon: svgScrollOld, divider: true },
      { label: 'Emotes', path: '/emotes', svgIcon: svgMasksTheater },
      { label: 'Season Pass', path: '/season-pass', icon: 'assets/icons/menu/season.png' },
      { label: 'Backstories - PTR Testing', path: '/backstories', icon: 'assets/icons/menu/backstories.png' },
      { label: 'Datasheets', path: '/datasheets', svgIcon: svgCode },
      { label: 'Actionlists', path: '/actionlists', svgIcon: svgCode },
    ],
  },
  {
    label: 'Char',
    category: 'character',
    icon: svgUser,
    items: [

      { label: 'Character', path: '/character', svgIcon: svgUser, exact: true },
      { label: 'Level', path: '/character/level', svgIcon: svgDiamondOutline },
      { label: 'Tradeskills', path: '/character/tradeskills', svgIcon: svgSickle },
      { label: 'Standing', path: '/character/standing', svgIcon: svgFlag },
      { label: 'Weapons', path: '/character/weapons', svgIcon: svgSword },
      { label: 'Inventory', path: '/inventory', svgIcon: svgTreasureChest, divider: true },
      { label: 'Gear Sets', path: '/gearsets', svgIcon: svgHelmetBattle },
      { label: 'Browse Builds', path: '/builds', svgIcon: svgGlobe },
      { label: 'Skill Trees', path: '/skill-trees', svgIcon: svgSitemap },
      { label: 'Transmog', path: '/transmog/sets', icon: 'assets/icons/menu/transmogtoken.webp' },
      { label: 'Damage Calculator', path: '/damage-calculator', svgIcon: svgSwords, divider: true },
      { label: 'Umbral Calculator', path: '/umbral-calculator', svgIcon: svgWeightHanging },
      { label: 'Armor Weights', path: '/armor-weights', svgIcon: svgWeightHanging },
    ],
  },
  {
    label: 'Track',
    category: 'tracking',
    icon: svgListCheck,
    items: [
      { label: 'Artifacts', path: '/tracking/artifacts', svgIcon: svgAxeBattle },
      { label: 'Cooking Recipes', path: '/tracking/recipes', svgIcon: svgTurkey },
      { label: 'Music Sheets', path: '/tracking/music-sheets', svgIcon: svgMusic },
      { label: 'Runes', path: '/tracking/runes', svgIcon: svgRune },
      { label: 'Schematics', path: '/tracking/schematics', svgIcon: svgRulerCombined },
      { label: 'Trophies', path: '/tracking/trophies', svgIcon: svgSkullCow },
    ],
  },
]

export interface LanguageOption {
  value: string
  label: string
  isDefault: boolean
}

export const LANG_OPTIONS: LanguageOption[] = [
  { value: 'de-de', label: 'DE', isDefault: false },
  { value: 'en-us', label: 'EN', isDefault: true },
  { value: 'es-es', label: 'ES', isDefault: false },
  { value: 'fr-fr', label: 'FR', isDefault: false },
  { value: 'it-it', label: 'IT', isDefault: false },
  { value: 'pl-pl', label: 'PL', isDefault: false },
  { value: 'pt-br', label: 'BR', isDefault: false },
]
