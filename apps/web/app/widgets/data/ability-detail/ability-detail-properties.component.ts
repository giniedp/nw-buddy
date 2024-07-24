import { DecimalPipe } from '@angular/common'
import { Component, TemplateRef, inject, viewChild } from '@angular/core'
import { AbilityData } from '@nw-data/generated'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { AbilityDetailStore } from './ability-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail-properties',
  template: `
    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
      [item]="store.properties()"
      [valueFormatter]="formatValue"
    />

    <ng-template [nwbGridValue] let-cell #tplCategory>
      <span
        [class.text-secondary]="!detail.hasLimits()"
        [class.text-error]="detail.hasLimits()"
        [nwbStatusEffectCategoryDetail]="cell.value"
        #detail="detail"
        class="inline-flex flex-row gap-1 items-center mr-1"
      >
        <span>
          {{ cell.value }}
        </span>
        @if (detail.hasLimits()) {
          <span [tooltip]="tplCategoryTip" [tooltipClass]="'max-w-none'">
            <nwb-icon [icon]="iconInfo" class="w-3 h-3 opacity-50 hover:opacity-100 cursor-help" />
          </span>
        }
        <ng-template #tplCategoryTip>
          <nwb-status-effect-limits-table [categoryId]="cell.value" />
        </ng-template>
      </span>
    </ng-template>

    <ng-template [nwbGridValue] let-cell #tplCategoryInfo>
      <ng-container [nwbStatusEffectCategoryDetailByProp]="cell.value" #detail="detail">
        @if (detail.hasLimits()) {
          <span [tooltip]="tplCategoryTip" [tooltipClass]="'max-w-none'" class="text-error inline-flex">
            <nwb-icon [icon]="iconInfo" class="w-3 h-3 opacity-50 hover:opacity-100 cursor-help" />
          </span>
        }
        <ng-template #tplCategoryTip>
          <nwb-status-effect-limits-table [property]="cell.value">
            <div class="text-center p-2">
              Limits only apply if the according category is present in <code>EffectCategories</code>
            </div>
          </nwb-status-effect-limits-table>
        </ng-template>
      </ng-container>
    </ng-template>

    <ng-template [nwbGridValue] let-cell #tplCooldownInfo>
      <span>
        {{ cell.value }}
      </span>
      @if (cooldown()) {
        <span [tooltip]="tplCooldownTip" [tooltipClass]="'px-2 py-1'" class="text-accent">
          ({{ cooldown().Time }}s)
          <nwb-icon [icon]="iconInfo" class="w-3 h-3 opacity-50 hover:opacity-100 cursor-help text-error" />
        </span>
      }
      <ng-template #tplCooldownTip>
        <nwb-property-grid class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight" [item]="cooldown()" />
      </ng-template>
    </ng-template>
  `,
  host: {
    class: 'block',
  },
  imports: [PropertyGridModule, TooltipModule, IconsModule, StatusEffectCategoryDetailModule],
})
export class AbilityDetailPropertiesComponent {
  protected decimals = inject(DecimalPipe)
  protected store = inject(AbilityDetailStore)
  protected cooldown = this.store.cooldown
  protected iconInfo = svgInfoCircle

  protected tplCategory = viewChild<TemplateRef<any>>('tplCategory')
  protected tplCategoryInfo = viewChild<TemplateRef<any>>('tplCategoryInfo')
  protected tplCooldownInfo = viewChild<TemplateRef<any>>('tplCooldownInfo')

  public formatValue = (value: any, key: keyof AbilityData): PropertyGridCell | PropertyGridCell[] => {
    switch (key) {
      case 'TargetStatusEffectDurationList':
        return statusEffectCells(value as AbilityData['TargetStatusEffectDurationList'])
      case 'RemoveTargetStatusEffectsList':
        return statusEffectCells(value as AbilityData['RemoveTargetStatusEffectsList'])
      case 'StatusEffectsList':
        return statusEffectCells(value as AbilityData['StatusEffectsList'])
      case 'SelfApplyStatusEffect':
        return statusEffectCells(value as AbilityData['SelfApplyStatusEffect'])
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
        return abilitiesCells(value as AbilityData['AbilityList'])
      }
      case 'DamageTableRow':
      case 'DamageTableRowOverride':
      case 'RemoteDamageTableRow': {
        return damageCells(value as AbilityData['DamageTableRow'])
      }
      case 'AttackType': {
        return damageCells(value as AbilityData['AttackType'])
      }
      case 'CooldownId': {
        return {
          value: value as AbilityData['CooldownId'],
          template: this.tplCooldownInfo(),
        }
      }
      case 'StatusEffectCategories':
      case 'StatusEffectCategoriesList':
      case 'StatusEffectDurationCats':
      case 'TargetStatusEffectCategory':
      case 'TargetStatusEffectDurationCats': {
        return (value as AbilityData['StatusEffectCategories']).map((it) => ({
          value: String(it),
          template: this.tplCategory(),
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
      routerLink: isLink ? ['status-effect', it] : null,
    }
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['ability', it],
    }
  })
}

function damageCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['damage'],
      queryParams: { search: it },
    }
  })
}
