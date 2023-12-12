export type NwLinkResource =
  | 'item'
  | 'recipe'
  | 'ability'
  | 'perk'
  | 'vitals'
  | 'status-effect'
  | 'poi'
  | 'quest'
  | 'mount'
  | 'gatherable'

export interface NwLinkOptions {
  ptr: boolean
  lang: string
  type: NwLinkResource
  id: string
}


const BUDDY_TYPE_MAP: Partial<Record<NwLinkResource, string>> = {
  item: 'items/table',
  recipe: 'crafting/table',
  ability: 'abilities/table',
  perk: 'perks/table',
  vitals: 'vitals/table',
  'status-effect': 'status-effects/table',
  poi: 'poi/table',
  quest: 'quests/table',
  mount: 'mounts/table',
  gatherable: 'gatherables/table',
}

export function buddyLinkUrl(options: NwLinkOptions) {
  if (!options.type || !options.id) {
    return ''
  }
  const type = BUDDY_TYPE_MAP[options.type]
  if (!type) {
    return null
  }

  return `${type}/${encodeURIComponent(options.id.trim())}`
}


const NWDB_TYPE_MAP: Partial<Record<NwLinkResource, string>> = {
  item: 'item',
  recipe: 'recipe',
  ability: 'ability',
  perk: 'perk',
  vitals: 'creature',
  'status-effect': 'status-effect',
  poi: 'zone',
  quest: 'quest',
  mount: 'mount',
  gatherable: 'gatherable',
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
