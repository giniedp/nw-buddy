import { listRecordVersions } from './diff/list-versions'
import { DataLoader } from './dsl'
import { NwDataLoader, NwDataOptions } from './nw-data-loader'
import { NwDataSheets } from './nw-data-sheets'
import { loadItemsTable } from './tables/items'
import { backstoriesItemsById } from './views/backstories'
import { resourceItemsForPerkId } from './views/perks'
import { seasonIds } from './views/seasons'
import { vitalsForGameMode } from './views/vitals'
export { NwDataOptions } from './nw-data-loader'

type ViewFunction<P, R> = (db: NwDataSheets, params: P) => Promise<R>

function bind<P, R>(db: NwDataSheets, fn: ViewFunction<P, R>): (params: P) => Promise<R> {
  return fn.bind(db, db)
}

export class NwData extends NwDataSheets {
  protected loader: DataLoader
  constructor(options: NwDataOptions) {
    super()
    this.loader = new NwDataLoader(options)
  }

  public backstoriesItemsById = bind(this, backstoriesItemsById)
  public vitalsForGameMode = bind(this, vitalsForGameMode)
  public resourceItemsForPerkId = bind(this, resourceItemsForPerkId)

  public loadItemsTable = bind(this, loadItemsTable)
  public listRecordVersions = listRecordVersions
  public seasonIds = bind(this, seasonIds)

  public async fetchText(url: string): Promise<string> {
    return this.loader.fetch(url).then((res) => res.text())
  }
  public async fetchJson(url: string): Promise<string> {
    return this.loader.fetch(url).then((res) => res.json())
  }
}
