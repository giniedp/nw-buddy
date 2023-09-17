import { getItemRarity, isItemArtifact, isItemNamed, isMasterItem } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export function getIconFrameClass(item: ItemDefinitionMaster | Housingitems, solid: boolean = true) {
  const result: string[] = [
    'nw-item-icon-frame',
    solid ? 'nw-item-icon-bg' : 'nw-item-icon-mask',
    `nw-item-rarity-${getItemRarity(item)}`,
  ]

  if (isMasterItem(item)) {
    if (isItemNamed(item)) {
      result.push('named')
    }
    if (isItemArtifact(item)) {
      result.push('artifact')
      result.push('nw-item-rarity-artifact')
    }
  }
  return result
}
