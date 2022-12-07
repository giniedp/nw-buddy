export type NwdbResource = 'item' | 'resource' | 'recipe' | 'ability' | 'perk' | 'quest' | 'creature' | 'gatherable' | 'npc' | 'status-effect' | 'zone'

export interface NwdbLinkOptions {
  ptr: boolean,
  lang: string,
  type: NwdbResource,
  id: string
}

export function nwdbLinkUrl(options: NwdbLinkOptions) {
  if (!options.type || !options.id) {
    return ''
  }
  let prefix = ''
  const lang = validLanguageToken(options.lang)
  if (lang) {
    prefix = `${lang}.`
  }
  if (options.ptr) {
    prefix = `ptr.`
  }
  return `https://${prefix}nwdb.info/db/${options.type}/${encodeURIComponent(options.id.trim())}`
}

function validLanguageToken(lang: string) {
  lang = lang?.substring(0, 2)?.toLowerCase()
  if (lang === 'pt') {
    lang = 'br'
  }
  if (lang === 'en') {
    lang = ''
  }
  return lang
}
