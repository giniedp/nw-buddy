import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'

export interface BackstoryTreeNode {
  readonly expand: boolean
  readonly match: boolean
  readonly children: Array<BackstoryTreeNode>
  readonly data: ItemDefinitionMaster | Housingitems
}
