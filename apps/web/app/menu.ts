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
    ]
  },
  {
    category: 'Tools & Infos',
    items: [
      { label: 'Territories', path: '/territories' },
      { label: 'Expeditions', path: '/dungeons' },
      { label: 'Armorsets', path: '/armorsets' },
      { label: 'Gear builder', path: '/gearbuilder' },
      { label: 'Umbral Shards', path: '/umbral-shards' },

      { label: 'Leveling and Skills', path: '/leveling' },

      { label: 'Trophies', path: '/info-cards/trophies', divider: true },
      { label: 'Runes', path: '/info-cards/runes' },
      { label: 'Vitals', path: '/info-cards/vitals' },
      { label: 'Gems', path: '/info-cards/gems' },
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
