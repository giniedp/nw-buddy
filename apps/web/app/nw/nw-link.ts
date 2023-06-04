export type NwLinkResource = 'item' | 'recipe' | 'ability' | 'perk' | 'vitals' | 'status-effect' | 'poi' | 'quest'

export interface NwLinkOptions {
  ptr: boolean,
  lang: string,
  type: NwLinkResource,
  id: string
}

const NWDB_TYPE_MAP: Partial<Record<NwLinkResource, string>>  = {
  item: 'item',
  recipe: 'recipe',
  ability: 'ability',
  perk: 'perk',
  vitals: 'creature',
  'status-effect': 'status-effect',
  poi: 'zone',
  quest: 'quest'
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

  return `https://${prefix}nwdb.info/db/${type}/${encodeURIComponent(options.id.trim())}`
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

const NWGUIDE_TYPE_MAP: Partial<Record<NwLinkResource, string>>  = {
  item: 'item',
  recipe: 'recipe',
  ability: 'ability',
  perk: 'perk',
  vitals: 'mob',
  'status-effect': 'status-effect',
}


export function nwguideLinkUrl(options: NwLinkOptions) {
  if (!options.type || !options.id) {
    return ''
  }
  const type = NWGUIDE_TYPE_MAP[options.type]
  if (!type) {
    return null
  }
  let lang = options.lang.toLowerCase()
  if (lang === 'en-us') {
    lang = ''
  }
  if (lang) {
    lang = `${lang}/`
  }
  return `https://new-world.guide/${lang}db/${type}/${encodeURIComponent(options.id.trim().toLowerCase())}`
}
