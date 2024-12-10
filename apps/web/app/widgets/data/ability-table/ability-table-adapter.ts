import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { COLS_ABILITYDATA } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { DataTableCategory, TableGridUtils, addGenericColumns } from '~/ui/data/table-grid'

import { DataViewAdapter, injectDataViewAdapterOptions } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { humanize } from '~/utils'
import {
  AbilityTableRecord,
  abilityColAfterAction,
  abilityColAttackType,
  abilityColDamageTable,
  abilityColDamageTableOverride,
  abilityColDescription,
  abilityColID,
  abilityColIcon,
  abilityColName,
  abilityColOnAction,
  abilityColRemoteDamageTable,
  abilityColSource,
  abilityColUiCategory,
  abilityColWeaponTag,
  abilityStatusEffectCategories,
  abilityStatusEffectCategoriesList,
  abilityTargetStatusEffectCategory,
} from './ability-table-cols'

@Injectable()
export class AbilityTableAdapter implements DataViewAdapter<AbilityTableRecord> {
  private db = injectNwData()
  private utils: TableGridUtils<AbilityTableRecord> = inject(TableGridUtils)
  private weaponTypes: NwWeaponTypesService = inject(NwWeaponTypesService)
  private config = injectDataViewAdapterOptions<AbilityTableRecord>({ optional: true })

  public entityID(item: AbilityTableRecord): string {
    return item.AbilityID.toLowerCase()
  }

  public entityCategories(item: AbilityTableRecord): DataTableCategory[] {
    const source = (item['$source'] as string).replace('AbilityTable', '')
    const id = source.toLowerCase()
    return [
      {
        id: id,
        label: humanize(source),
        icon: item.$weaponType?.IconPathSmall,
      },
    ]
  }

  public virtualOptions(): VirtualGridOptions<AbilityTableRecord> {
    // TODO: add virtual suppoort
    return null
  }

  public gridOptions(): GridOptions<AbilityTableRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils)
  }

  public connect(): Observable<AbilityTableRecord[]> {
    return combineLatest({
      abilities: this.db.abilitiesAll(),
      effects: this.db.statusEffectsByIdMap(),
      weaponTypes: this.weaponTypes.byTag$,
    })
      .pipe(
        switchMap(async ({ abilities, effects, weaponTypes }) => {
          const result = abilities.map((it): AbilityTableRecord => {
            return {
              ...it,
              $weaponType: weaponTypes.get(it.WeaponTag),
              $selfApplyStatusEffect: it.SelfApplyStatusEffect?.map((id) => effects.get(id)),
              $otherApplyStatusEffect: it.OtherApplyStatusEffect?.map((it) => effects.get(it)),
            }
          })
          return result
        }),
      )
      .pipe(map((list) => sortBy(list, (it) => (!!it.WeaponTag && !!it.DisplayName && !!it.Description ? -1 : 1))))
  }
}

function buildOptions(util: TableGridUtils<AbilityTableRecord>) {
  const result: GridOptions<AbilityTableRecord> = {
    columnDefs: [
      abilityColIcon(util),
      abilityColName(util),
      abilityColID(util),
      abilityColDescription(util),
      abilityColWeaponTag(util),
      abilityColSource(util),
      abilityColAttackType(util),
      abilityColUiCategory(util),
      abilityColDamageTable(util),
      abilityColDamageTableOverride(util),
      abilityColRemoteDamageTable(util),
      abilityColAfterAction(util),
      abilityColOnAction(util),
      abilityStatusEffectCategories(util),
      abilityStatusEffectCategoriesList(util),
      abilityTargetStatusEffectCategory(util),
    ],
  }
  addGenericColumns(result, {
    props: COLS_ABILITYDATA,
  })
  return result
}
