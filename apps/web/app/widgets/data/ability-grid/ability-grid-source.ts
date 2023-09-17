import { GridOptions } from '@ag-grid-community/core'
import { Injectable, inject } from '@angular/core'
import { getWeaponTagLabel } from '@nw-data/common'
import { COLS_ABILITY } from '@nw-data/generated'
import { sortBy } from 'lodash'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { DataGridSource, DataGridUtils } from '~/ui/data-grid'
import { DataGridSourceOptions } from '~/ui/data-grid/provider'
import { DataGridCategory } from '~/ui/data-grid/types'
import { addGenericColumns } from '~/ui/data-grid/utils'
import {
  AbilityGridRecord,
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
} from './ability-grid-cols'

@Injectable()
export class AbilityGridSource extends DataGridSource<AbilityGridRecord> {
  private db = inject(NwDbService)
  private utils: DataGridUtils<AbilityGridRecord> = inject(DataGridUtils)
  private weaponTypes: NwWeaponTypesService = inject(NwWeaponTypesService)
  private config = inject(DataGridSourceOptions, {
    optional: true,
  })

  public override entityID(item: AbilityGridRecord): string {
    return item.AbilityID
  }

  public override entityCategories(item: AbilityGridRecord): DataGridCategory[] {
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

  public override buildOptions(): GridOptions<AbilityGridRecord> {
    const build = this.config?.buildOptions || buildOptions
    return build(this.utils)
  }

  public override connect(): Observable<AbilityGridRecord[]> {
    return combineLatest({
      abilities: this.db.abilities,
      effects: this.db.statusEffectsMap,
      weaponTypes: this.weaponTypes.byTag$,
    })
      .pipe(
        switchMap(async ({ abilities, effects, weaponTypes }) => {
          const result = abilities.map((it): AbilityGridRecord => {
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

function buildOptions(util: DataGridUtils<AbilityGridRecord>) {
  const result: GridOptions<AbilityGridRecord> = {
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
