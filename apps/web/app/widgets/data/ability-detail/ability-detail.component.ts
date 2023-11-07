import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, forwardRef } from '@angular/core'
import { Ability } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { PropertyGridCell } from '~/ui/property-grid/property-grid-cell.directive'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { AbilityDetailStore } from './ability-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail',
  templateUrl: './ability-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    DecimalPipe,
    TooltipModule,
    IconsModule,
    StatusEffectCategoryDetailModule,
  ],
  providers: [
    DecimalPipe,
    {
      provide: AbilityDetailStore,
      useExisting: forwardRef(() => AbilityDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class AbilityDetailComponent extends AbilityDetailStore {
  @Input()
  public set abilityId(value: string) {
    this.patchState({ abilityId: value })
  }

  @Input()
  public disableProperties: boolean

  @ViewChild('tplCategory', { static: true })
  protected tplCategory: TemplateRef<any>

  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>

  protected iconInfo = svgInfoCircle

  public constructor(db: NwDbService, private decimals: DecimalPipe) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Ability): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      case 'TargetStatusEffectDurationList':
        return statusEffectCells(value as Ability['TargetStatusEffectDurationList'])
      case 'RemoveTargetStatusEffectsList':
        return statusEffectCells(value as Ability['RemoveTargetStatusEffectsList'])
      case 'StatusEffectsList':
        return statusEffectCells(value as Ability['StatusEffectsList'])
      case 'SelfApplyStatusEffect':
        return statusEffectCells(value as Ability['SelfApplyStatusEffect'])
      case 'DamageTableStatusEffectOverride':
      case 'DontHaveStatusEffect':
      case 'OnEquipStatusEffect':
      case 'OtherApplyStatusEffect':
      case 'StatusEffect':
      case 'StatusEffectBeingApplied':
      case 'TargetStatusEffect': {
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
      case 'DamageTableRow':
      case 'DamageTableRowOverride':
      case 'RemoteDamageTableRow': {
        return damageCells(value as Ability['DamageTableRow'])
      }
      case 'AttackType': {
        return damageCells(value as Ability['AttackType'])
      }
      case 'StatusEffectCategories': {
        return (value as Ability['StatusEffectCategories']).map((it) => ({
          value: String(it),
          template: this.tplCategory,
        }))
      }
      case 'StatusEffectCategoriesList': {
        return (value as Ability['StatusEffectCategoriesList']).map((it) => ({
          value: String(it),
          template: this.tplCategory,
        }))
      }
      case 'TargetStatusEffectCategory': {
        return (value as Ability['TargetStatusEffectCategory']).map((it) => ({
          value: String(it),
          template: this.tplCategory,
        }))
      }
      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
          ]
        }
        return [
          {
            value: String(value),
            accent: typeof value === 'number',
            info: typeof value === 'boolean',
            bold: typeof value === 'boolean',
          },
        ]
      }
    }
  }
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return {
      value: String(it),
      accent: isLink,
      routerLink: isLink ? ['/status-effects/table', it] : null,
    }
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/abilities/table', it],
    }
  })
}

function damageCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/damage/table'],
      queryParams: { search: it },
    }
  })
}
