import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_DAMAGETABLE } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  DamageGridRecord,
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
} from './damage-grid-cols'

@Injectable()
export class DamageGridSource extends DataGridSource<DamageGridRecord> {
  private db = inject(NwDbService)
  private config = inject(DataGridSourceOptions, {
    optional: true,
  })
  private utils: DataGridUtils<DamageGridRecord> = inject(DataGridUtils)

  public override entityID(item: DamageGridRecord): string {
    return item.DamageID
  }

  public override entityCategories(item: DamageGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<DamageGridRecord> {
    if (this.config?.buildOptions) {
      return this.config.buildOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public override connect() {
    return this.db.damageTables
  }
}

function buildOptions(util: DataGridUtils<DamageGridRecord>) {
  const result: GridOptions<DamageGridRecord> = {
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
