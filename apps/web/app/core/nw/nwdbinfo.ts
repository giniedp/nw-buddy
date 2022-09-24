import { APP_CONFIG  } from '../../../environments/environment'
export type NwdbResource = 'item' | 'resource' | 'recipe' | 'ability' | 'perk' | 'quest' | 'creature' | 'gatherable' | 'npc' | 'status-effect'

export function nwdbLinkUrl(itemType: NwdbResource, itemId: string) {
  const prefix = APP_CONFIG.isPTR ? 'ptr.' : ''
  return `https://${prefix}nwdb.info/db/${itemType}/${encodeURIComponent(itemId)}`
}
