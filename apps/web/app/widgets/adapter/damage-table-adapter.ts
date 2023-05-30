import { Injectable } from '@angular/core'
import { COLS_DAMAGETABLE } from '@nw-data/generated'
import { Damagetable } from '@nw-data/generated'
import { ColDef, GridOptions } from 'ag-grid-community'
import { Observable, defer, map, of } from 'rxjs'
import { NwDbService } from '~/nw'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { damageTypeIcon } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class DamageTableAdapter extends DataTableAdapter<Damagetable> {
  public static provider() {
    return dataTableProvider({
      adapter: DamageTableAdapter,
    })
  }

  public entityID(item: Damagetable): string {
    return item.DamageID
  }

  public entityCategory(item: Damagetable): DataTableCategory {
    return item['$source']
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      // suppressRowHoverHighlight: true,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: '',
              target: '_blank',
              icon: damageTypeIcon(data.DamageType) || NW_FALLBACK_ICON,
            })
          }),
        }),
        this.colDef({
          colId: 'id',
          headerValueGetter: () => 'ID',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            return data.DamageID
          }),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'damageType',
          headerValueGetter: () => 'DamageType',
          field: this.fieldName('DamageType'),
          width: 200,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'attackType',
          headerValueGetter: () => 'AttackType',
          field: this.fieldName('AttackType'),
          width: 200,
          filter: SelectFilter,
        }),

        this.colDef({
          colId: 'dmgCoef',
          headerValueGetter: () => 'DmgCoef',
          field: this.fieldName('DmgCoef'),
        }),
        this.colDef({
          colId: 'dmgCoefCrit',
          headerValueGetter: () => 'DmgCoefCrit',
          field: this.fieldName('DmgCoefCrit'),
        }),
        this.colDef({
          colId: 'dmgCoefHead',
          headerValueGetter: () => 'DmgCoefHead',
          field: this.fieldName('DmgCoefHead'),
        }),
        this.colDef({
          colId: 'canCrit',
          headerValueGetter: () => 'CanCrit',
          field: this.fieldName('CanCrit'),
        }),
        this.colDef({
          colId: 'critHitStun',
          headerValueGetter: () => 'CritHitStun',
          field: this.fieldName('CritHitStun'),
        }),
        this.colDef({
          colId: 'critPowerLevel',
          headerValueGetter: () => 'CritPowerLevel',
          field: this.fieldName('CritPowerLevel'),
        }),

        this.colDef({
          colId: 'affixes',
          headerValueGetter: () => 'Affixes',
          field: this.fieldName('Affixes'),
          width: 200,
          filter: SelectFilter,
        }),
        this.colDef({
          colId: 'affliction',
          headerValueGetter: () => 'Affliction',
          field: this.fieldName('Affliction'),
          width: 200,
          filter: SelectFilter,
        }),
      ],
    })
  ).pipe(map((options) => appendFields(options, Array.from(Object.entries(COLS_DAMAGETABLE)))))

  public entities: Observable<Damagetable[]> = defer(() => this.db.damageTables).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService) {
    super()
  }
}

function appendFields(options: GridOptions, fields: string[][]) {
  for (const [field, type] of fields) {
    const exists = options.columnDefs.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      field: field,
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    options.columnDefs.push(colDef)
  }
  return options
}
