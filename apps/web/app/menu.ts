export interface MenuEntry {
  label: string
  path: string
  icon?: string
  divider?: boolean
}

export interface MenuGroup {
  category: string
  items: MenuEntry[]
}

export const MAIN_MENU: MenuGroup[] = [
  {
    category: 'Database',
    items: [
      { label: 'Items', path: '/items', icon: 'assets/icons/menu/items.png' },
      { label: 'Housing', path: '/housing', icon: 'assets/icons/tradeskills/furnishing.png' },
      { label: 'Crafting', path: '/crafting', icon: 'assets/icons/tradeskills/weaponsmithing.png' },

      { label: 'Perks', path: '/perks', icon: 'assets/icons/menu/perks.png', divider: true },
      { label: 'Abilities', path: '/abilities', icon: 'assets/icons/menu/abilities.png' },
      { label: 'Statuseffects', path: '/status-effects', icon: 'assets/icons/menu/statuseffects.png' },

      { label: 'Points Of Interest', path: '/poi', icon: 'assets/icons/menu/fasttraveliconinactive.png', divider: true },
      { label: 'Vitals', path: '/vitals', icon: 'assets/icons/menu/vitals.png' },
      { label: 'Loot Limits', path: '/loot-limits',  icon: 'assets/icons/menu/icon_filter_chrono.png' },
      { label: 'Loot Tables', path: '/loot', icon: 'assets/icons/menu/loot.png' },
    ]
  },
  {
    category: 'Character',
    items: [
      { label: 'Levels', path: '/leveling', icon: 'assets/icons/menu/levels.png'  },
      { label: 'Inventory', path: '/inventory', icon: 'assets/icons/menu/storage.png' },
      { label: 'Gear Sets', path: '/gearsets', icon: 'assets/icons/menu/gearsets.png' },
      { label: 'Skill Trees', path: '/skill-trees', icon: 'assets/icons/menu/skill-trees.png' },
    ]
  },
  {
    category: 'Tools & Infos',
    items: [
      { label: 'Territories', path: '/territories', icon: 'assets/icons/menu/territories.png' },
      { label: 'Expeditions', path: '/dungeons', icon: 'assets/icons/menu/expeditions.png' },
      { label: 'Armorsets', path: '/armorsets', icon: 'assets/icons/menu/armorsets.png'  },
      { label: 'Umbral Shards', path: '/umbral-shards', icon: 'assets/icons/menu/umbral.png' },

      { label: 'Trophies', path: '/info-cards/trophies', divider: true, icon: 'assets/icons/slots/icon_housing_category_trophies.png' },
      { label: 'Runes', path: '/info-cards/runes', icon: 'assets/icons/slots/iconrune.png' },
      { label: 'Bosses & Families', path: '/info-cards/vitals', icon: 'assets/icons/menu/vitals-families.png' },
      { label: 'Gems', path: '/info-cards/gems', icon: 'assets/icons/menu/gems.png' },

      { label: 'Cooking Recipes', path: '/info-cards/cooking-recipes', icon: 'assets/icons/menu/recipes.png', divider: true },
      { label: 'Schematics', path: '/info-cards/schematics', icon: 'assets/icons/menu/schematic_blank.png' },
      { label: 'Music Sheets', path: '/info-cards/music-sheets', icon: 'assets/icons/menu/icon_tradeskill_music.png' },
    ]
  },
  {
    category: null,
    items: [
      { label: 'Links', path: '/links' },
      { label: 'Preferences', path: '/preferences' },
      { label: 'About', path: '/about' },
    ]
  }
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
