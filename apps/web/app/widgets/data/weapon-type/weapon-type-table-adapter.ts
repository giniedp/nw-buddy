import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getUIHousingCategoryLabel } from '@nw-data/common'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'
import { WeaponTypeCellComponent } from './weapon-type-cell.component'
import {
  WeaponTypeTableRecord,
  weaponTypeColGroupName,
  weaponTypeColIcon,
  weaponTypeColName,
} from './weapon-type-table-cols'

@Injectable()
export class WeaponTypeTableAdapter implements DataViewAdapter<WeaponTypeTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<WeaponTypeTableRecord>({ optional: true })
  private utils: TableGridUtils<WeaponTypeTableRecord> = inject(TableGridUtils)
  private service = inject(NwWeaponTypesService)

  public entityID(item: WeaponTypeTableRecord): string {
    return item.WeaponTypeID
  }

  public entityCategories(item: WeaponTypeTableRecord): DataTableCategory[] {
    if (!item.CategoryName) {
      return null
    }
    return [
      {
        id: item.CategoryName,
        label: this.i18n.get(getUIHousingCategoryLabel(item.CategoryName)),
        icon: '',
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<WeaponTypeTableRecord> {
    return WeaponTypeCellComponent.buildGridOptions()
  }

  public gridOptions(): GridOptions<WeaponTypeTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonWeaponTypeGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(this.config?.source || this.service.all$, (items) => {
    if (this.config?.filter) {
      items = items.filter(this.config.filter)
    }
    if (this.config?.sort) {
      items = [...items].sort(this.config.sort)
    }
    return items
  })
}

export function buildCommonWeaponTypeGridOptions(util: TableGridUtils<WeaponTypeTableRecord>) {
  const result: GridOptions<WeaponTypeTableRecord> = {
    columnDefs: [weaponTypeColIcon(util), weaponTypeColName(util), weaponTypeColGroupName(util)],
  }
  return result
}
