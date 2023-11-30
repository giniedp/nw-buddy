import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { defer, filter } from 'rxjs'
import { SkillBuildsStore } from '~/data'
import { NwDbService } from '~/nw'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { DataViewAdapter } from '~/ui/data/data-view'
import { DataTableCategory, TABLE_GRID_ADAPTER_OPTIONS, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { SkillsetCellComponent } from './skillset-cell.component'
import { SkillsetTableRecord, skillsetColName, skillsetColSkills, skillsetColWeapon } from './skillset-table-cols'

@Injectable()
export class SkillsetTableAdapter implements DataViewAdapter<SkillsetTableRecord> {
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<SkillsetTableRecord> = inject(TableGridUtils)
  private store = inject(SkillBuildsStore)
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
      return this.config.virtualOptions()
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

  public entities = defer(() => {
    return this.config?.source || this.store.rows$
  }).pipe(
    filter((it) => {
      if (!it) {
        return false
      }
      return this.config?.filter ? this.config.filter(it) : true
    }),
  )
}

function buildOptions(util: TableGridUtils<SkillsetTableRecord>) {
  const result: GridOptions<SkillsetTableRecord> = {
    columnDefs: [skillsetColName(util), skillsetColWeapon(util), skillsetColSkills(util)],
  }
  return result
}
