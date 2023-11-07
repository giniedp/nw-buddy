import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getWeaponTagLabel } from '@nw-data/common'
import { COLS_ABILITY } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import {
  TABLE_GRID_ADAPTER_OPTIONS,
  DataTableCategory,
  TableGridAdapter,
  TableGridUtils,
  addGenericColumns,
} from '~/ui/data/table-grid'

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
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'

@Injectable()
export class AbilityTableAdapter implements DataViewAdapter<AbilityTableRecord>, TableGridAdapter<AbilityTableRecord> {
  private db = inject(NwDbService)
  private utils: TableGridUtils<AbilityTableRecord> = inject(TableGridUtils)
  private weaponTypes: NwWeaponTypesService = inject(NwWeaponTypesService)
  private config = inject(TABLE_GRID_ADAPTER_OPTIONS, { optional: true })

  public entityID(item: AbilityTableRecord): string {
    return item.AbilityID
  }

  public entityCategories(item: AbilityTableRecord): DataTableCategory[] {
    if (!item.WeaponTag) {
      return null
    }
    return [
      {
        id: item.WeaponTag,
        label: getWeaponTagLabel(item.WeaponTag),
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
      abilities: this.db.abilities,
      effects: this.db.statusEffectsMap,
      weaponTypes: this.weaponTypes.byTag$,
    })
      .pipe(
        switchMap(async ({ abilities, effects, weaponTypes }) => {
          const result = abilities.map((it): AbilityTableRecord => {
            return {
              ...it,
              $weaponType: weaponTypes.get(it.WeaponTag),
              $selfApplyStatusEffect: it.SelfApplyStatusEffect?.map((id) => effects.get(id)),
              $otherApplyStatusEffect: effects.get(it.OtherApplyStatusEffect),
            }
          })
          return result
        })
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
    props: COLS_ABILITY,
  })
  return result
}
