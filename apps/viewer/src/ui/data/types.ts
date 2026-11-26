import type { SheetFamily } from '../../api/browse'

/**
 * A row type of the family list, with the names of its sheets that match the filter
 */
export interface FamilyListEntry {
  family: SheetFamily
  sheets: string[]
}
