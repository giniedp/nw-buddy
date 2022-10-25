import { environment  } from '../../environments/environment'
export type NwdbResource = 'item' | 'resource' | 'recipe' | 'ability' | 'perk' | 'quest' | 'creature' | 'gatherable' | 'npc' | 'status-effect' | 'zone'

export function nwdbLinkUrl(itemType: NwdbResource, itemId: string) {
  const prefix = environment.isPTR ? 'ptr.' : ''
  if (itemType && itemId) {
    return `https://${prefix}nwdb.info/db/${itemType}/${encodeURIComponent(itemId)}`
  }
  return ''
}
