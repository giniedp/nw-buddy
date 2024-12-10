import { GridOptions } from '@ag-grid-community/core'
import { chain } from 'lodash'
import { from, map, Observable } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import { CreatureTypeCellComponent, CreatureTypeRecord } from './creature-type-cell.component'

export class CreatureTypePickerAdapter implements DataViewAdapter<CreatureTypeRecord> {
  private db = injectNwData()

  public entityID(item: CreatureTypeRecord): string | number {
    return item.CreatureTypeID.toLowerCase()
  }
  public entityCategories(item: CreatureTypeRecord): DataViewCategory[] {
    if (item.Category) {
      return [{ id: item.Category.toLowerCase(), label: item.Category }]
    }
    return null
  }
  public connect(): Observable<CreatureTypeRecord[]> {
    return from(this.db.vitalsAll()).pipe(
      map((list) =>
        chain(list)
          .map((it) => it.CreatureType)
          .sort()
          .uniq()
          .filter((it) => !!it)
          .value(),
      ),
      map((list) =>
        list.map((it) => {
          return {
            CreatureTypeID: it,
            Category: getCategory(it),
            DisplayName: humanize(it),
          }
        }),
      ),
    )
  }

  public gridOptions(): GridOptions<CreatureTypeRecord> {
    return null
  }
  public virtualOptions(): VirtualGridOptions<CreatureTypeRecord> {
    return CreatureTypeCellComponent.buildGridOptions()
  }
}

function getCategory(type: string) {
  if (!type) {
    return ''
  }
  const match = type.match(/^(Dungeon|Elite|Named|OutpostRush|Raid|Solo)/)
  return match?.[1]
}
