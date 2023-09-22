import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_DAMAGETABLE, Damagetable } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { TABLE_GRID_ADAPTER_OPTIONS, TableGridAdapter, TableGridUtils } from '~/ui/data/table-grid'
import { DataTableCategory } from '~/ui/data/table-grid'
import { addGenericColumns } from '~/ui/data/table-grid'
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
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

@Injectable()
export class DamageTableAdapter implements DataViewAdapter<DamageTableRecord>, TableGridAdapter<DamageTableRecord> {
  private db = inject(NwDbService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })
  private utils: TableGridUtils<DamageTableRecord> = inject(TableGridUtils)

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

function buildOptions(util: TableGridUtils<DamageTableRecord>) {
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
