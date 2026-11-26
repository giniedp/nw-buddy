import type { AssetType, TypeGroup } from '../../../api/browse'

/**
 * An asset type with its index in the type list of the server
 */
export interface TypeEntry {
  index: number
  type: AssetType
}

/**
 * The types of a group with their file count
 */
export interface TypeGroupEntry {
  group: TypeGroup
  entries: TypeEntry[]
  count: number
}
