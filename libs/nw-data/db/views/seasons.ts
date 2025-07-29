import type { NwDataSheets } from '../nw-data-sheets'

export async function seasonIds(db: NwDataSheets): Promise<string[]> {
  const rows = await db.seasonsAll()
  return rows.map((it) => it.SeasonId)
}
