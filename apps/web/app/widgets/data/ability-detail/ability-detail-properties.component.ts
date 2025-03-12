import { DecimalPipe } from '@angular/common'
import { Component, TemplateRef, inject, viewChild } from '@angular/core'
import { AbilityData } from '@nw-data/generated'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { PropertyGridCell, PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { linkCell, localizedCell, valueCell } from '~/ui/property-grid/cells'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { AbilityDetailStore } from './ability-detail.store'
import { diffButtonCell } from '~/widgets/diff-tool'

@Component({
  selector: 'nwb-ability-detail-properties',
  template: `
    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
      [item]="store.properties()"
      [descriptor]="descriptor"
    />

    <ng-template [nwbGridCell] let-value #tplCategory>
      <span
        [class.text-secondary]="!detail.hasLimits()"
        [class.text-error]="detail.hasLimits()"
        [nwbStatusEffectCategoryDetail]="value"
        #detail="detail"
        class="inline-flex flex-row gap-1 items-center mr-1"
      >
        <span>
          {{ value }}
        </span>
        @if (detail.hasLimits()) {
          <span [tooltip]="tplCategoryTip" [tooltipClass]="'max-w-none'">
            <nwb-icon [icon]="iconInfo" class="w-3 h-3 opacity-50 hover:opacity-100 cursor-help" />
          </span>
        }
        <ng-template #tplCategoryTip>
          <nwb-status-effect-limits-table [categoryId]="value" />
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

    <ng-template [nwbGridValue] let-value #tplCooldownInfo>
      <span>
        {{ value }}
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

  public descriptor = gridDescriptor<AbilityData>(
    {
      DisplayName: (value) => localizedCell({ value }),
      Description: (value) => localizedCell({ value }),
      // status effects
      TargetStatusEffectDurationList: (value) => statusEffectCells(value),
      RemoveTargetStatusEffectsList: (value) => statusEffectCells(value),
      StatusEffectsList: (value) => statusEffectCells(value),
      SelfApplyStatusEffect: (value) => statusEffectCells(value),
      DamageTableStatusEffectOverride: (value) => statusEffectCells(value),
      DontHaveStatusEffect: (value) => statusEffectCells(value),
      OnEquipStatusEffect: (value) => statusEffectCells(value),
      OtherApplyStatusEffect: (value) => statusEffectCells(value),
      StatusEffect: (value) => statusEffectCells(value),
      StatusEffectBeingApplied: (value) => statusEffectCells(value),
      TargetStatusEffect: (value) => statusEffectCells(value),
      // abilities
      AbilityID: (value) => [
        ...abilitiesCells(value),
        diffButtonCell({ record: this.store.ability(), idKey: 'AbilityID' }),
      ],
      RequiredEquippedAbilityId: (value) => abilitiesCells(value),
      RequiredAbilityId: (value) => abilitiesCells(value),
      AbilityList: (value) => abilitiesCells(value),
      // damage rows
      DamageTableRow: (value) => damageCells(value),
      DamageTableRowOverride: (value) => damageCells(value),
      RemoteDamageTableRow: (value) => damageCells(value),
      AttackType: (value) => damageCells(value),
      // cooldown
      CooldownId: (value) => ({
        value: value,
        template: this.tplCooldownInfo(),
      }),
      // status effect categories
      StatusEffectCategories: (value) => value.map((it) => ({ value: it, template: this.tplCategory() })),
      StatusEffectCategoriesList: (value) => value.map((it) => ({ value: it, template: this.tplCategory() })),
      StatusEffectDurationCats: (value) => value.map((it) => ({ value: it, template: this.tplCategory() })),
      TargetStatusEffectCategory: (value) => value.map((it) => ({ value: it, template: this.tplCategory() })),
      TargetStatusEffectDurationCats: (value) => value.map((it) => ({ value: it, template: this.tplCategory() })),
    },
    (value) => valueCell({ value }),
  )
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return linkCell({ value: it, routerLink: isLink ? ['status-effect', it] : null })
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => linkCell({ value: it, routerLink: ['ability', it] }))
}

function damageCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return linkCell({ value: it, routerLink: ['damage', 'damagetable-' + it], queryParams: { search: it } })
  })
}
