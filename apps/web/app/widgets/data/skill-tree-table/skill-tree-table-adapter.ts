import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { NwData } from '@nw-data/db'
import { defer } from 'rxjs'
import { SkillTreesService, buildSkillTreeRow, injectNwData } from '~/data'
import { getWeaponTypeInfo } from '~/nw/weapon-types'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { SkillTreeCellComponent } from './skill-tree-cell.component'
import { SkillTreeTableRecord, skillTreeColName, skillTreeColSkills, skillTreeColWeapon } from './skill-tree-table-cols'

@Injectable()
export class SkillTreeTableAdapter implements DataViewAdapter<SkillTreeTableRecord> {
  private skills = inject(SkillTreesService)
  private data = injectNwData()
  private config = injectDataViewAdapterOptions<SkillTreeTableRecord>({ optional: true })
  private utils: TableGridUtils<SkillTreeTableRecord> = inject(TableGridUtils)
  public entityID(item: SkillTreeTableRecord): string {
    return item.record.id
  }

  public entityCategories(item: SkillTreeTableRecord): DataTableCategory[] {
    const info = getWeaponTypeInfo(item.record?.weapon)
    return [
      {
        id: item.record.weapon,
        label: info?.UIName || item.record.weapon,
        icon: info?.IconPathSmall,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<SkillTreeTableRecord> {
    if (this.config?.virtualOptions) {
      return this.config.virtualOptions(this.utils)
    }
    return SkillTreeCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<SkillTreeTableRecord> {
    let options: GridOptions<SkillTreeTableRecord>
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
      items: defer(() => this.config?.source || sourceRows(this.data, this.skills)),
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

function buildOptions(util: TableGridUtils<SkillTreeTableRecord>) {
  const result: GridOptions<SkillTreeTableRecord> = {
    columnDefs: [skillTreeColName(util), skillTreeColWeapon(util), skillTreeColSkills(util)],
  }
  return result
}

function sourceRows(data: NwData, skills: SkillTreesService) {
  return selectStream(
    {
      items: skills.observeRecords('local'),
      abilities: data.abilitiesByIdMap(),
    },
    ({ items, abilities }) => {
      return items.map((it) => buildSkillTreeRow(it, abilities))
    },
  )
}
