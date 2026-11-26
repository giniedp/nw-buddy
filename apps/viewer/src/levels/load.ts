import type { NwbtClient } from '../api/browse'
import { parseDatasheet, type Datasheet } from '../formats/datasheet/datasheet'
import { parseLocXml } from '../formats/loc/loc'
import { buildLevelCatalog, type LevelCatalog, type SheetRow } from './catalog'

const DATATABLES = 'sharedassets/springboardentitites/datatables'

/**
 * The datasheets of the catalog. A missing or unreadable sheet gives no rows: the catalog still lists the levels.
 */
const SHEETS = {
  modes: `${DATATABLES}/javelindata_gamemodes.datasheet`,
  maps: `${DATATABLES}/javelindata_gamemodemaps.datasheet`,
  schedules: `${DATATABLES}/javelindata_schedules.datasheet`,
}

/**
 * The localization files with the game mode and map names (en-us): PvP modes and maps, expeditions, trials, raids and
 * catacombs, the arena. Found by scanning all en-us files for the `DisplayName` keys.
 */
const STRINGS = [
  'localization/en-us/gamemodes.loc.xml',
  'localization/en-us/objectivesdungeons.loc.xml',
  'localization/en-us/pvparenas.loc.xml',
]

/**
 * The level catalog of a nwbt server: the level list, the game mode datasheets and their localization
 */
export class LevelCatalogLoader {
  private readonly nwbt: NwbtClient
  private loading: Promise<LevelCatalog> | null = null

  public constructor(nwbt: NwbtClient) {
    this.nwbt = nwbt
  }

  /**
   * The level catalog, loaded once. Rejects only when the level list itself fails.
   */
  public load(): Promise<LevelCatalog> {
    this.loading ??= this.read().catch((err) => {
      this.loading = null
      throw err
    })
    return this.loading
  }

  private async read(): Promise<LevelCatalog> {
    const [index, modes, maps, schedules, strings] = await Promise.all([
      this.nwbt.getLevels(),
      this.loadRows(SHEETS.modes),
      this.loadRows(SHEETS.maps),
      this.loadRows(SHEETS.schedules),
      this.loadStrings(STRINGS),
    ])
    return buildLevelCatalog({ index, modes, maps, schedules, strings }, new Date())
  }

  private async loadRows(path: string): Promise<SheetRow[]> {
    try {
      const res = await fetch(this.nwbt.fileUrl(path))
      if (!res.ok) {
        throw new Error(`${res.status}`)
      }
      return sheetRows(parseDatasheet(new Uint8Array(await res.arrayBuffer())))
    } catch (err) {
      console.warn('level catalog: sheet not loaded', path, String(err))
      return []
    }
  }

  private async loadStrings(paths: readonly string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>()
    await Promise.all(
      paths.map(async (path) => {
        try {
          const res = await fetch(this.nwbt.fileUrl(path))
          if (!res.ok) {
            throw new Error(`${res.status}`)
          }
          for (const item of parseLocXml(await res.text())) {
            result.set(item.key.toLowerCase(), item.value)
          }
        } catch (err) {
          console.warn('level catalog: strings not loaded', path, String(err))
        }
      }),
    )
    return result
  }
}

/**
 * The rows of a datasheet as objects by column name, cells with the default value left out
 */
export function sheetRows(sheet: Datasheet): SheetRow[] {
  const rows: SheetRow[] = []
  for (let row = 0; row < sheet.rowCount; row++) {
    const result: SheetRow = {}
    sheet.columns.forEach((column, col) => {
      if (!sheet.isDefault(row, col)) {
        result[column.name] = sheet.cell(row, col)
      }
    })
    rows.push(result)
  }
  return rows
}
