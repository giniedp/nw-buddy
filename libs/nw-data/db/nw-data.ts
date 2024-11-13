import { DataLoader } from './dsl'
import { NwDataLoader, NwDataOptions } from './nw-data-loader'
import { NwDataSheets } from './nw-data-sheets'
import { backstoriesItemsById } from './views/backstories'
export { NwDataOptions } from './nw-data-loader'

export class NwData extends NwDataSheets {
  protected loader: DataLoader
  constructor(options: NwDataOptions) {
    super()
    this.loader = new NwDataLoader(options)
  }

  public backstoriesItemsById(backstoryId: string) {
    return backstoriesItemsById(this, backstoryId)
  }
}
