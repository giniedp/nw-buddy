import { ItemRarity } from '@nw-data/common'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { ItemInstance } from '~/data'

export interface BackstoryTreeNode {
  readonly expand: boolean
  readonly match: boolean
  readonly children: Array<BackstoryTreeNode>
  readonly data: MasterItemDefinitions | HouseItems
}

export interface InventoryItem extends ItemInstance {
  item: MasterItemDefinitions | HouseItems
  isNamed: boolean
  rarity: ItemRarity
}
