import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getWeaponTagLabel } from '@nw-data/common'
import { COLS_ABILITY } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import {
  DATA_TABLE_SOURCE_OPTIONS,
  DataTableCategory,
  DataTableSource,
  DataTableUtils,
  addGenericColumns,
} from '~/ui/data-grid'

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
} from './ability-table-cols'

@Injectable()
export class AbilityTableSource extends DataTableSource<AbilityTableRecord> {
  private db = inject(NwDbService)
  private utils: DataTableUtils<AbilityTableRecord> = inject(DataTableUtils)
  private weaponTypes: NwWeaponTypesService = inject(NwWeaponTypesService)
  private config = inject(DATA_TABLE_SOURCE_OPTIONS, { optional: true })

  public override entityID(item: AbilityTableRecord): string {
    return item.AbilityID
  }

  public override entityCategories(item: AbilityTableRecord): DataTableCategory[] {
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

  public override gridOptions(): GridOptions<AbilityTableRecord> {
    const build = this.config?.gridOptions || buildOptions
    return build(this.utils)
  }

  public override connect(): Observable<AbilityTableRecord[]> {
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

function buildOptions(util: DataTableUtils<AbilityTableRecord>) {
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
    ],
  }
  addGenericColumns(result, {
    props: COLS_ABILITY,
  })
  return result
}
