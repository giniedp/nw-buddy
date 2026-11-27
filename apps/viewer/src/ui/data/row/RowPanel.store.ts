import { createMemo } from 'solid-js'
import { familyText, rowKey, type FamilyRows, type RowRef } from '../families'
import type { RowField } from './types'

export interface RowPanelProps {
  rows: FamilyRows
  row: number
  /**
   * The row's tab is visible: a hidden tab releases the engine canvas
   */
  shown: boolean
}

export type RowPanelStore = ReturnType<typeof createRowPanelStore>

/**
 * The filled fields of a row
 */
export function createRowPanelStore(props: RowPanelProps) {
  const fields = createMemo(() => rowFields(props.rows, props.row))

  return {
    fields,
    /**
     * The row as the source of the references of its fields
     */
    from: (): RowRef => ({ family: props.rows.family.name, key: rowKey(props.rows, props.row) }),
  }
}

/**
 * The filled fields of a row
 */
export function rowFields(rows: FamilyRows, row: number): RowField[] {
  return rows.family.columns.flatMap((column, c) => {
    const text = familyText(rows, row, c)
    if (!text) {
      return []
    }
    return [{ column, text }]
  })
}
