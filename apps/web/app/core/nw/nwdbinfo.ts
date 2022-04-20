export type NwdbResource = 'item' | 'resource' | 'recipe' | 'ability' | 'perk' | 'quest' | 'creature' | 'gatherable' | 'npc' | 'status-effect'

export function nwdbLinkUrl(itemType: NwdbResource, itemId: string) {
  return `https://nwdb.info/db/${itemType}/${encodeURIComponent(itemId)}`
}
