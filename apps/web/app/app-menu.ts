export interface AppMenuEntry {
  label: string
  path: string
  icon?: string
  divider?: boolean
}

export interface AppMenuGroup {
  category: string
  label: string
  items: AppMenuEntry[]
}

export const APP_MENU: AppMenuGroup[] = [
  {
    label: 'Database',
    category: 'database',
    items: [
      { label: 'Items', path: '/items', icon: 'assets/icons/menu/items.png' },
      { label: 'Housing', path: '/housing', icon: 'assets/icons/tradeskills/furnishing.png' },
      { label: 'Crafting', path: '/crafting', icon: 'assets/icons/tradeskills/weaponsmithing.png' },

      { label: 'Perks', path: '/perks', icon: 'assets/icons/menu/perks.png', divider: true },
      { label: 'Abilities', path: '/abilities', icon: 'assets/icons/menu/abilities.png' },
      { label: 'Status Effects', path: '/status-effects', icon: 'assets/icons/menu/statuseffects.png' },
      { label: 'Damage Rows', path: '/damage', icon: 'assets/icons/menu/damage.png' },

      {
        label: 'Points Of Interest',
        path: '/poi',
        icon: 'assets/icons/menu/fasttraveliconinactive.png',
        divider: true,
      },
      { label: 'Quests', path: '/quests', icon: 'assets/icons/menu/quests.png' },
      { label: 'Vitals', path: '/vitals', icon: 'assets/icons/menu/vitals.png' },
      { label: 'Gatherables', path: '/gatherables', icon: 'assets/icons/menu/gatherable.png' },
      { label: 'Loot Limits', path: '/loot-limits', icon: 'assets/icons/menu/icon_filter_chrono.png', divider: true },
      { label: 'Loot Tables', path: '/loot', icon: 'assets/icons/menu/loot.png' },
      { label: 'Loot Buckets', path: '/loot-buckets', icon: 'assets/icons/menu/loot.png' },
      { label: 'Game Events', path: '/game-events', icon: 'assets/icons/menu/events.png' },

      { label: 'Game Modes', path: '/game-modes', icon: 'assets/icons/menu/expeditions.png', divider: true },
      { label: 'Armor Sets', path: '/armor-sets', icon: 'assets/icons/menu/armorsets.png' },
      { label: 'Armor Weights', path: '/armor-weights', icon: 'assets/icons/menu/icon_weight.png' },
      { label: 'Transmog', path: '/transmog', icon: 'assets/icons/menu/transmogtoken.webp' },
      { label: 'Mounts', path: '/mounts', icon: 'assets/icons/menu/reward_type_mount.png' },
    ],
  },
  {
    label: 'Character',
    category: 'character',
    items: [
      { label: 'Levels', path: '/leveling', icon: 'assets/icons/menu/levels.png' },
      { label: 'Inventory', path: '/inventory', icon: 'assets/icons/menu/storage.png' },
      { label: 'Gear Sets', path: '/gearsets', icon: 'assets/icons/menu/gearsets.png' },
      { label: 'Skill Trees', path: '/skill-trees', icon: 'assets/icons/menu/skill-trees.png' },
      { label: 'Territories', path: '/territories', icon: 'assets/icons/menu/territories.png' },
    ],
  },
  {
    label: 'Tracking',
    category: 'tracking',
    items: [
      {
        label: 'Artifacts',
        path: '/tracking/artifacts',
        icon: 'assets/icons/menu/artifacts.png',
      },
      {
        label: 'Cooking Recipes',
        path: '/tracking/recipes',
        icon: 'assets/icons/menu/recipes.png',
      },
      { label: 'Music Sheets', path: '/tracking/music-sheets', icon: 'assets/icons/menu/icon_tradeskill_music.png' },
      { label: 'Runes', path: '/tracking/runes', icon: 'assets/icons/slots/iconrune.png' },

      { label: 'Schematics', path: '/tracking/schematics', icon: 'assets/icons/menu/schematic_blank.png' },
      {
        label: 'Trophies',
        path: '/tracking/trophies',
        icon: 'assets/icons/slots/icon_housing_category_trophies.png',
      },
    ],
  },
  {
    label: '',
    category: 'misc',
    items: [
      { label: 'Links', path: '/links' },
      { label: 'Preferences', path: '/preferences' },
      { label: 'About', path: '/about' },
    ],
  },
]

export const LANG_OPTIONS = [
  { value: 'de-de', label: 'DE' },
  { value: 'en-us', label: 'EN' },
  { value: 'es-es', label: 'ES' },
  { value: 'fr-fr', label: 'FR' },
  { value: 'it-it', label: 'IT' },
  { value: 'pl-pl', label: 'PL' },
  { value: 'pt-br', label: 'BR' },
]
