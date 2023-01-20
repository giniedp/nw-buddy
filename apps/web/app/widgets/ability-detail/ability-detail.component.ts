import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Ability } from '@nw-data/types'
import { uniq } from 'lodash'
import { map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { PropertyGridCell } from '~/ui/property-grid/property-grid-cell.directive'
import { AbilityDetailService } from './ability-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail',
  templateUrl: './ability-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [
    {
      provide: AbilityDetailService,
      useExisting: forwardRef(() => AbilityDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class AbilityDetailComponent extends AbilityDetailService {
  @Input()
  public set abilityId(value: string) {
    this.abilityId$.next(value)
  }

  @Input()
  public showProperties: boolean

  public constructor(db: NwDbService) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Ability): PropertyGridCell | PropertyGridCell[] =>  {
    switch (key) {
      case 'TargetStatusEffectDurationList':
        return statusEffectCells(value as Ability['TargetStatusEffectDurationList'])
      case 'RemoveTargetStatusEffectsList':
          return statusEffectCells(value as Ability['RemoveTargetStatusEffectsList'])
      case 'StatusEffectsList':
        return statusEffectCells(value as Ability['StatusEffectsList'])
      case 'StatusEffect':
      case 'TargetStatusEffect':
      case 'OtherApplyStatusEffect':
      case 'SelfApplyStatusEffect':
      case 'DontHaveStatusEffect':
      case 'StatusEffectBeingApplied':
      case 'OnEquipStatusEffect': {
        return statusEffectCells(value)
      }
      case 'AbilityID':
      case 'RequiredEquippedAbilityId':
      case 'RequiredAbilityId': {
        return abilitiesCells(value)
      }
      case 'AbilityList': {
        return abilitiesCells(value as Ability['AbilityList'])
      }
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }
        return [{
          value: String(value),
          accent: typeof value === 'number',
          info: typeof value === 'boolean',
          bold: typeof value === 'boolean'
        }]
      }
    }
  }
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/status-effects/table', it]
    }
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/abilities/table', it]
    }
  })
}

