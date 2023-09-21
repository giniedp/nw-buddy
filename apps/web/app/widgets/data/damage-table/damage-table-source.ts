import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_DAMAGETABLE } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DATA_TABLE_SOURCE_OPTIONS, DataTableSource, DataTableUtils } from '~/ui/data-grid'
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

@Injectable()
export class DamageTableSource extends DataTableSource<DamageTableRecord> {
  private db = inject(NwDbService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })
  private utils: DataTableUtils<DamageTableRecord> = inject(DataTableUtils)

  public override entityID(item: DamageTableRecord): string {
    return item.DamageID
  }

  public override entityCategories(item: DamageTableRecord): DataTableCategory[] {
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

  public override gridOptions(): GridOptions<DamageTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public override connect() {
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
