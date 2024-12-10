import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize, selectStream } from '~/utils'

import { COLS_WEAPONITEMDEFINITIONS } from '@nw-data/generated'
import { defer } from 'rxjs'
import {
  WeaponDefinitionTableRecord,
  weaponDefColBaseDamage,
  weaponDefColBaseStaggerDamage,
  weaponDefColBlockStability,
  weaponDefColBlockStaminaDamage,
  weaponDefColCritChance,
  weaponDefColCritDamageMultiplier,
  weaponDefColEffectID,
  weaponDefColID,
  weaponDefColIcon,
  weaponDefColPrimaryUse,
  weaponDefColTierNumber,
} from './weapon-definitions-table-cols'

@Injectable()
export class WeaponDefinitionTableAdapter implements DataViewAdapter<WeaponDefinitionTableRecord> {
  private db = injectNwData()
  private i18n = inject(TranslateService)
  private config = injectDataViewAdapterOptions<WeaponDefinitionTableRecord>({ optional: true })
  private utils: TableGridUtils<WeaponDefinitionTableRecord> = inject(TableGridUtils)

  public entityID(item: WeaponDefinitionTableRecord): string {
    return item.WeaponID
  }

  public entityCategories(item: WeaponDefinitionTableRecord): DataTableCategory[] {
    if (!item.WeaponEffectId) {
      return null
    }
    return [
      {
        id: item.WeaponEffectId,
        label: humanize(item.WeaponEffectId),
        icon: '',
      },
    ]
  }
  public virtualOptions(): VirtualGridOptions<WeaponDefinitionTableRecord> {
    return null
  }

  public gridOptions(): GridOptions<WeaponDefinitionTableRecord> {
    if (this.config?.gridOptions) {
      return this.config.gridOptions(this.utils)
    }
    return buildCommonWeaponTypeGridOptions(this.utils)
  }

  public connect() {
    return this.source$
  }

  private source$ = selectStream(this.config?.source || defer(() => this.db.weaponItemsAll()), (items) => {
    if (this.config?.filter) {
      items = items.filter(this.config.filter)
    }
    if (this.config?.sort) {
      items = [...items].sort(this.config.sort)
    }
    return items
  })
}

export function buildCommonWeaponTypeGridOptions(util: TableGridUtils<WeaponDefinitionTableRecord>) {
  const result: GridOptions<WeaponDefinitionTableRecord> = {
    columnDefs: [
      weaponDefColIcon(util),
      weaponDefColID(util),
      weaponDefColEffectID(util),
      weaponDefColTierNumber(util),
      weaponDefColBaseDamage(util),
      weaponDefColBaseStaggerDamage(util),
      weaponDefColBlockStaminaDamage(util),
      weaponDefColCritChance(util),
      weaponDefColCritDamageMultiplier(util),
      weaponDefColBlockStability(util),
      weaponDefColPrimaryUse(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_WEAPONITEMDEFINITIONS,
  })
  return result
}
