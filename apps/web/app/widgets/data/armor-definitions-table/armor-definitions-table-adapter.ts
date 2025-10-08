import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { selectStream } from '~/utils'

import { COLS_ARMORITEMDEFINITIONS } from '@nw-data/generated'
import { defer } from 'rxjs'
import { ArmorDefinitionTableRecord, armorDefColID, armorDefColIcon } from './armor-definitions-table-cols'

@Injectable()
export class ArmorDefinitionTableAdapter implements DataViewAdapter<ArmorDefinitionTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<ArmorDefinitionTableRecord>({ optional: true })
  private utils: TableGridUtils<ArmorDefinitionTableRecord> = inject(TableGridUtils)

  public entityID(item: ArmorDefinitionTableRecord): string {
    return item.WeaponID
  }

  public entityCategories(item: ArmorDefinitionTableRecord): DataTableCategory[] {
    return null
    // if (!item.WeaponEffectId) {
    //   return null
    // }
    // return [
    //   {
    //     id: item.WeaponEffectId,
    //     label: humanize(item.WeaponEffectId),
    //     icon: '',
    //   },
    // ]
  }
  public virtualOptions(): VirtualGridOptions<ArmorDefinitionTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<ArmorDefinitionTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonArmorTypeGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(this.config?.source || defer(() => this.db.armorItemsAll()), (items) => {
    if (this.config?.filter) {
      items = items.filter(this.config.filter)
    }
    if (this.config?.sort) {
      items = [...items].sort(this.config.sort)
    }
    return items
  })
}

export function buildCommonArmorTypeGridOptions(util: TableGridUtils<ArmorDefinitionTableRecord>) {
  const result: GridOptions<ArmorDefinitionTableRecord> = {
    columnDefs: [armorDefColIcon(util), armorDefColID(util)],
  }
  addGenericColumns(result, {
    props: COLS_ARMORITEMDEFINITIONS,
  })
  return result
}
