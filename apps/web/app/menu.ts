export const MAIN_MENU = [
  {
    category: 'Database',
    items: [
      { label: 'Items', path: '/items' },
      { label: 'Housing', path: '/housing' },
      { label: 'Crafting', path: '/crafting' },

      { label: 'Perks', path: '/perks', divider: true },
      { label: 'Abilities', path: '/abilities' },
      { label: 'Statuseffects', path: '/status-effects' },

      { label: 'Points Of Interest', path: '/poi', divider: true },
      { label: 'Vitals', path: '/vitals' },
      { label: 'Loot Limits', path: '/loot-limits' },
      { label: 'Loot Tables', path: '/loot' },
    ]
  },
  {
    category: 'Character',
    items: [
      { label: 'Levels', path: '/leveling' },
      { label: 'Inventory', path: '/inventory' },
      { label: 'Gear Sets', path: '/gearsets' },
      { label: 'Skill Trees', path: '/skill-trees' },
    ]
  },
  {
    category: 'Tools & Infos',
    items: [
      { label: 'Territories', path: '/territories' },
      { label: 'Expeditions', path: '/dungeons' },
      { label: 'Armorsets', path: '/armorsets' },
      { label: 'Umbral Shards', path: '/umbral-shards' },

      { label: 'Trophies', path: '/info-cards/trophies', divider: true },
      { label: 'Runes', path: '/info-cards/runes' },
      { label: 'Vitals', path: '/info-cards/vitals' },
      { label: 'Gems', path: '/info-cards/gems' },

      { label: 'Cooking Recipes', path: '/info-cards/cooking-recipes', divider: true },
      { label: 'Schematics', path: '/info-cards/schematics' },
      { label: 'Music Sheets', path: '/info-cards/music-sheets' },
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
