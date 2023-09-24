import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { defer, filter, take } from 'rxjs'
import { SkillBuildsStore } from '~/data'
import { NwDbService } from '~/nw'
import { augmentWithTransactions } from '~/ui/data/ag-grid'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridUtils } from '~/ui/data/table-grid'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { shareReplayRefCount } from '~/utils'
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

  public entityCategories(item: SkillsetTableRecord) {
    return null
  }

  public virtualOptions(): VirtualGridOptions<SkillsetTableRecord> {
    return null
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
    augmentWithTransactions(options, {
      onCreate: this.store.rowCreated$,
      onUpdate: this.store.rowUpdated$,
      onDestroy: this.store.rowDestroyed$,
    })
    return options
  }

  public connect() {
    return this.entities
  }

  public entities = defer(() => this.config?.source || this.store.rows$)
    .pipe(filter((it) => it != null))
    .pipe(take(1))
    .pipe(shareReplayRefCount(1))
}

function buildOptions(util: TableGridUtils<SkillsetTableRecord>) {
  const result: GridOptions<SkillsetTableRecord> = {
    columnDefs: [skillsetColName(util), skillsetColWeapon(util), skillsetColSkills(util)],
  }
  return result
}
