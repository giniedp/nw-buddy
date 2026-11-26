import type { SheetColumn } from '../../../api/browse'

/**
 * A filled field of a row: its column and its text
 */
export interface RowField {
  column: SheetColumn
  text: string
}
