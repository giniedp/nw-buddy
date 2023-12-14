import { ItemRarity } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { ItemInstance } from '~/data'

export interface BackstoryTreeNode {
  readonly expand: boolean
  readonly match: boolean
  readonly children: Array<BackstoryTreeNode>
  readonly data: ItemDefinitionMaster | Housingitems
}

export interface InventoryItem extends ItemInstance {
  item: ItemDefinitionMaster | Housingitems
  isNamed: boolean
  rarity: ItemRarity
}
