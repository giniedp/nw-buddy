import { DecimalPipe } from '@angular/common'
import { Component, TemplateRef, inject, viewChild } from '@angular/core'
import { parseScalingPerGearScore } from '@nw-data/common'
import { AffixStatData, PerkData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail-properties',
  template: `
    <nwb-property-grid
      class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
      [item]="properties()"
      [valueFormatter]="formatValue"
    />
    @if (affixProps(); as affix) {
      <nwb-item-divider />
      <nwb-property-grid
        class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight"
        [item]="affix"
        [valueFormatter]="formatAffixValue"
      />
    }
  `,
  imports: [NwModule, PropertyGridModule, ItemFrameModule],
  host: {
    class: 'flex flex-col gap-2',
  }
})
export class PerkDetailPropertiesComponent {
  protected store = inject(PerkDetailStore)
  protected properties = this.store.properties
  protected affixProps = this.store.affixProps
  protected tplCategoryInfo = viewChild<TemplateRef<any>>('tplCategoryInfo')
  protected decimals = inject(DecimalPipe)

  public formatValue = (value: any, key: keyof PerkData): PropertyGridCell[] => {
    switch (key) {
      case 'PerkID': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['perk', value],
          },
        ]
      }
      case 'Affix': {
        return [
          {
            value: String(value),
            primary: true,
            italic: true,
          },
        ]
      }
      case 'ItemClass': {
        return createTags(value as PerkData['ItemClass'])
      }
      case 'ExcludeItemClass': {
        return createTags(value as PerkData['ExcludeItemClass'])
      }
      case 'ExclusiveLabels': {
        return createTags(value as PerkData['ExclusiveLabels'])
      }
      case 'EquipAbility': {
        return (value as PerkData['EquipAbility']).map((it) => {
          return {
            value: it,
            accent: true,
            routerLink: ['ability', it],
          }
        })
      }
      case 'ScalingPerGearScore': {
        return [
          {
            accent: true,
            value: parseScalingPerGearScore(value)
              .map(({ score, scaling }, i) => {
                if (i === 0) {
                  return this.decimals.transform(scaling, '0.0-7')
                }
                return [this.decimals.transform(score, '0.0-7'), this.decimals.transform(scaling, '0.0-7')].join(':')
              })
              .join(', '),
          },
        ]
        return value
      }
      default: {
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

  public formatAffixValue = (value: any, key: keyof AffixStatData): PropertyGridCell[] => {
    switch (key) {
      case 'StatusEffect': {
        return statusEffectCells(value)
      }
      default: {
        if (typeof value === 'number') {
          return [
            {
              value: this.decimals.transform(value, '0.0-7'),
              accent: true,
            },
            {
              template: this.tplCategoryInfo(),
              value: key,
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

function createTags(value: string[]): PropertyGridCell[] {
  return value.map((it) => {
    return {
      value: it,
      secondary: true,
    }
  })
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
