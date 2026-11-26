import { createMemo } from 'solid-js'
import { useApp } from '../../app/ViewerApp'
import { assetPath } from '../assets'
import { familyText, rowKey, type FamilyRows, type RowRef } from '../families'
import { locPlain } from '../locMarkup'
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
 * The fields of a row and what its head shows: the name (a localized name field, else the key), the icon, the sheet
 */
export function createRowPanelStore(props: RowPanelProps) {
  const app = useApp()
  const fields = createMemo(() => rowFields(props.rows, props.row))
  const title = createMemo(() => {
    const name = nameField(fields())
    if (!name) {
      return rowKey(props.rows, props.row)
    }
    return locPlain(app.loc.text(name.text) ?? name.text)
  })
  const icon = createMemo(() => {
    const path = iconField(fields())?.text
    if (!path) {
      return null
    }
    return app.nwbt.thumbnailUrl(assetPath(path), 96)
  })
  const sheet = () => props.rows.family.sheets[props.rows.sheetOf[props.row]]

  return {
    fields,
    title,
    /**
     * The url of the row's icon, null without one
     */
    icon,
    sheet,
    /**
     * The key and the sheet of the row, e.g. `Sword_T5 · MasterItemDefinitions_Common`
     */
    subtitle: () => `${rowKey(props.rows, props.row) || `row ${props.row}`} · ${sheet().name}`,
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

/**
 * The localized name of a row: the first loc field with "name" in its column
 */
export function nameField(fields: RowField[]): RowField | undefined {
  return fields.find((it) => it.column.kind === 'loc' && /name/i.test(it.column.name))
}

/**
 * The icon of a row: the first asset field with "icon" in its column that is an image
 */
export function iconField(fields: RowField[]): RowField | undefined {
  return fields.find(
    (it) => it.column.kind === 'asset' && /icon/i.test(it.column.name) && /\.(png|dds)$/i.test(it.text),
  )
}
