export type NwLinkResource =
  | 'ability'
  | 'damage'
  | 'emote'
  | 'game-event'
  | 'gatherable'
  | 'housing'
  | 'item'
  | 'loot-limit'
  | 'loot'
  | 'lore'
  | 'mount'
  | 'npc'
  | 'perk'
  | 'player-title'
  | 'poi'
  | 'quest'
  | 'recipe'
  | 'status-effect'
  | 'transmog'
  | 'vitals'

export interface NwLinkOptions {
  ptr: boolean
  lang: string
  type: NwLinkResource
  id: string
}

const BUDDY_TYPE_MAP: Record<NwLinkResource, string> = {
  'game-event': 'game-events',
  'loot-limit': 'loot-limits',
  'player-title': 'player-titles',
  'status-effect': 'status-effects',
  ability: 'abilities',
  damage: 'damage',
  emote: 'emotes',
  gatherable: 'gatherables',
  housing: 'housing',
  item: 'items',
  loot: 'loot-tables',
  lore: 'lore',
  mount: 'mounts',
  npc: 'npcs',
  perk: 'perks',
  poi: 'map',
  quest: 'quests',
  recipe: 'crafting',
  transmog: 'transmog',
  vitals: 'vitals',
}

export function buddyLinkUrl(options: NwLinkOptions & { category?: string }) {
  const type = BUDDY_TYPE_MAP[options.type]
  if (!type) {
    return ''
  }
  const result: string[] = []
  if (options.lang && options.lang !== 'en-us') {
    result.push(options.lang)
  }
  result.push(type)
  if (options.category) {
    result.push(';c=' + encodeURIComponent(options.category))
  }
  if (options.id) {
    result.push(encodeURIComponent(options.id.trim().toLowerCase()))
  }
  return '/' + result.join('/')
}

const NWDB_TYPE_MAP: Partial<Record<NwLinkResource, string>> = {
  item: 'item',
  housing: 'item',
  recipe: 'recipe',
  ability: 'ability',
  perk: 'perk',
  vitals: 'creature',
  'status-effect': 'status-effect',
  poi: 'zone',
  quest: 'quest',
  mount: 'mount',
  gatherable: 'gatherable',
  npc: 'npc',
}

export function nwdbLinkUrl(options: NwLinkOptions) {
  if (!options.type || !options.id) {
    return ''
  }
  const type = NWDB_TYPE_MAP[options.type]
  if (!type) {
    return null
  }

  let prefix = ''
  const lang = nwdbLinkLocale(options.lang)
  if (lang) {
    prefix = `${lang}.`
  }
  if (options.ptr) {
    prefix = `ptr.`
  }

  return `https://${prefix}nwdb.info/db/${type}/${encodeURIComponent(options.id.trim().toLowerCase())}`
}

function nwdbLinkLocale(lang: string) {
  lang = lang?.substring(0, 2)?.toLowerCase()
  if (lang === 'pt') {
    lang = 'br'
  }
  if (lang === 'en') {
    lang = ''
  }
  return lang
}
