import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_DAMAGETABLE, Damagetable } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataGridAdapter, DataTableUtils } from '~/ui/data-grid'
import { DataTableCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  DamageTableRecord,
  damageColAffixes,
  damageColAffliction,
  damageColAttackType,
  damageColCanCrit,
  damageColCritHitStun,
  damageColCritPowerLevel,
  damageColDamageType,
  damageColDmgCoef,
  damageColDmgCoefCrit,
  damageColDmgCoefHead,
  damageColID,
  damageColIcon,
} from './damage-table-cols'
import { DataViewAdapter } from '~/ui/data-view'
import { VirtualGridOptions } from '~/ui/virtual-grid'

@Injectable()
export class DamageTableAdapter implements DataViewAdapter<DamageTableRecord>, DataGridAdapter<DamageTableRecord> {
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<DamageTableRecord> = inject(DataTableUtils)

  public entityID(item: DamageTableRecord): string {
    return item.DamageID
  }

  public entityCategories(item: DamageTableRecord): DataTableCategory[] {
    if (!item['$source']) {
      return null
    }
    return [
      {
        id: item['$source'],
        label: item['$source'],
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<Damagetable> {
    return null
  }

  public gridOptions(): GridOptions<DamageTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return this.db.damageTables
  }
}

function buildOptions(util: DataTableUtils<DamageTableRecord>) {
  const result: GridOptions<DamageTableRecord> = {
    columnDefs: [
      damageColIcon(util),
      damageColID(util),
      damageColDamageType(util),
      damageColAttackType(util),
      damageColDmgCoef(util),
      damageColDmgCoefCrit(util),
      damageColDmgCoefHead(util),
      damageColCanCrit(util),
      damageColCritHitStun(util),
      damageColCritPowerLevel(util),
      damageColAffixes(util),
      damageColAffliction(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_DAMAGETABLE,
  })
  return result
}
