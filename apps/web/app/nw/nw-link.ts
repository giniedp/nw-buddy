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
  item: 'items',
  housing: 'housing',
  recipe: 'crafting',
  ability: 'abilities',
  perk: 'perks',
  vitals: 'vitals',
  'status-effect': 'status-effects',
  poi: 'zones',
  quest: 'quests',
  mount: 'mounts',
  gatherable: 'gatherables',
  npc: 'npcs',
  loot: 'loot',
  transmog: 'transmog',
  damage: 'damage',
  lore: 'lore',
  'player-title': 'player-titles',
  emote: 'emotes',
  'loot-limit': 'loot-limits',
  'game-event': 'game-events',
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
  result.push(options.category || 'table')
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
