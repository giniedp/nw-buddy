import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { defer } from 'rxjs'
import { NwDataService, SkillBuildsDB, buildSkillSetRow } from '~/data'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { SkillsetCellComponent } from './skillset-cell.component'
import { SkillsetTableRecord, skillsetColName, skillsetColSkills, skillsetColWeapon } from './skillset-table-cols'

@Injectable()
export class SkillsetTableAdapter implements DataViewAdapter<SkillsetTableRecord> {
  private db = inject(SkillBuildsDB)
  private data = inject(NwDataService)
  private config = injectDataViewAdapterOptions<SkillsetTableRecord>({ optional: true })
  private utils: TableGridUtils<SkillsetTableRecord> = inject(TableGridUtils)
  public entityID(item: SkillsetTableRecord): string {
    return item.record.id
  }

  public entityCategories(item: SkillsetTableRecord): DataTableCategory[] {
    const info = getWeaponTypeInfo(item.record?.weapon)
    return [
      {
        id: item.record.weapon,
        label: info?.UIName || item.record.weapon,
        icon: info?.IconPathSmall,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<SkillsetTableRecord> {
    if (this.config?.virtualOptions) {
      return this.config.virtualOptions(this.utils)
    }
    return SkillsetCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<SkillsetTableRecord> {
    let options: GridOptions<SkillsetTableRecord>
    if (this.config?.gridOptions) {
      options = this.config.gridOptions(this.utils)
    } else {
      options = buildOptions(this.utils)
    }
    if (!options.getRowId) {
      options.getRowId = ({ data }) => data.record.id
    }
    return options
  }

  public connect() {
    return this.entities
  }

  public entities = selectStream(
    {
      items: defer(() => this.config?.source || sourceRows(this.data, this.db)),
    },
    ({ items }) => {
      items = items || []
      const filter = this.config?.filter
      if (filter) {
        items = items.filter(filter)
      }
      const sort = this.config?.sort
      if (sort) {
        items = [...items].sort(sort)
      }
      return items
    },
  )
}

function buildOptions(util: TableGridUtils<SkillsetTableRecord>) {
  const result: GridOptions<SkillsetTableRecord> = {
    columnDefs: [skillsetColName(util), skillsetColWeapon(util), skillsetColSkills(util)],
  }
  return result
}

function sourceRows(data: NwDataService, db: SkillBuildsDB) {
  return selectStream(
    {
      items: db.observeAll(),
      abilities: data.abilitiesMap,
    },
    ({ items, abilities }) => {
      return items.map((it) => buildSkillSetRow(it, abilities))
    },
  )
}
