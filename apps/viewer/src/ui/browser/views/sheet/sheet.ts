import { filledColumns, findGroups, type SheetGroups } from '../../../../formats/datasheet/analysis'
import { parseDatasheet, type Datasheet } from '../../../../formats/datasheet/datasheet'
import type { FileContents } from '../../../../api/files'

/**
 * A parsed datasheet and what it holds
 */
export interface SheetData {
  sheet: Datasheet
  /**
   * Per column: has a filled cell
   */
  filled: boolean[]
  /**
   * The numbered column groups of a wide sheet, null for other sheets
   */
  groups: SheetGroups | null
}

// by the bytes: the analysis goes with the content when the tab closes (releaseContent)
const sheets = new WeakMap<Uint8Array, SheetData>()

/**
 * Loads, parses and analyzes a datasheet. Throws if it is not one.
 */
export async function loadSheet(files: FileContents, path: string): Promise<SheetData> {
  const bytes = await files.contentBytes(path)
  let data = sheets.get(bytes)
  if (!data) {
    const sheet = parseDatasheet(bytes)
    const filled = filledColumns(sheet)
    data = { sheet, filled, groups: findGroups(sheet, filled) }
    sheets.set(bytes, data)
  }
  return data
}
