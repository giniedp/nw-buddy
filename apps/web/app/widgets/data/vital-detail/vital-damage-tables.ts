import { NwData } from '@nw-data/db'
import { DamageData, DATASHEETS, ScannedVital } from '@nw-data/generated'
import { eqCaseInsensitive } from '~/utils'

export interface DamageTableFile {
  name: string
  rows: DamageData[]
}

/**
 * The damage table files of a vital (its metadata `tables`)
 */
export function selectVitalDamageTableNames(id: string, meta: ScannedVital) {
  let tables = meta?.tables || []
  // TODO: fix this in the pipeline
  if (eqCaseInsensitive(id, 'Isabella_DG_ShatterMtn_Phase2_00')) {
    tables = tables.filter((it) => it.toLowerCase().includes('phase2'))
  }
  if (eqCaseInsensitive(id, 'Dryad_Siren')) {
    tables = tables.filter((it) => it.toLowerCase().includes('dryad_siren'))
  }
  return tables
}

/**
 * The damage tables of the files, with their rows
 */
export async function loadVitalDamageTables(db: NwData, files: string[]): Promise<Array<DamageTableFile>> {
  if (!files?.length) {
    return []
  }
  const tables = Object.entries(DATASHEETS.DamageData)
  const rows = files
    .map((file) => {
      file = 'datatables/' + file.replace(/\\/g, '/').replace(/\.xml$/, '.json')
      return tables.find(([_, url]) => {
        if (typeof url.uri === 'string') {
          return eqCaseInsensitive(url.uri, file)
        }
        return url.uri.some((it) => eqCaseInsensitive(it, file))
      })
    })
    .filter((it) => !!it)
    .map(async ([name, uri]) => {
      return {
        name,
        rows: await db.loadDatasheet(uri),
      }
    })
  return Promise.all(rows)
}
