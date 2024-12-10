import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_DAMAGEDATA, DamageData } from '@nw-data/generated'
import { from } from 'rxjs'
import { injectNwData } from '~/data'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
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
  damageSource,
} from './damage-table-cols'

@Injectable()
export class DamageTableAdapter implements DataViewAdapter<DamageTableRecord> {
  private db = injectNwData()
  private config = injectDataViewAdapterOptions<DamageTableRecord>({ optional: true })
  private utils: TableGridUtils<DamageTableRecord> = inject(TableGridUtils)

  public entityID(item: DamageTableRecord): string {
    return [item.$source, item.DamageID].join('-').toLowerCase()
    // return item.DamageID.toLowerCase()
  }

  public entityCategories(item: DamageTableRecord): DataTableCategory[] {
    if (!item['$source']) {
      return null
    }
    const source = (item['$source'] as string).replace('DamageTable', '')
    return [
      {
        id: source.toLowerCase(),
        label: humanize(source) || 'unnamed',
        icon: '',
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<DamageTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<DamageTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildOptions(this.utils)
  }

  public connect() {
    return from(this.db.damageTablesAll())
  }
}

function buildOptions(util: TableGridUtils<DamageTableRecord>) {
  const result: GridOptions<DamageTableRecord> = {
    columnDefs: [
      damageColIcon(util),
      damageColID(util),
      damageSource(util),
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
    props: COLS_DAMAGEDATA,
  })
  return result
}
