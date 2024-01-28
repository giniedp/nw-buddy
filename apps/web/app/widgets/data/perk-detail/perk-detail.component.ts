import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild, forwardRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { parseScalingPerGearScore } from '@nw-data/common'
import { Affixstats, Perks } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { GsInputComponent } from '~/ui/gs-input'
import { IconsModule } from '~/ui/icons'
import { svgInfoCircle } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectCategoryDetailModule } from '../status-effect-category-detail'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  templateUrl: './perk-detail.component.html',
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    GsInputComponent,
    FormsModule,
    TooltipModule,
    StatusEffectCategoryDetailModule,
    IconsModule,
  ],
  providers: [
    DecimalPipe,
    {
      provide: PerkDetailStore,
      useExisting: forwardRef(() => PerkDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class PerkDetailComponent extends PerkDetailStore {
  @Input()
  public set perkId(value: string) {
    this.patchState({ perkId: value })
  }

  @Input()
  public disableProperties: boolean
  protected iconInfo = svgInfoCircle
  protected trackByIndex = (i: number) => i
  @ViewChild('tplCategoryInfo', { static: true })
  protected tplCategoryInfo: TemplateRef<any>
  public constructor(db: NwDataService, protected decimals: DecimalPipe) {
    super(db)
  }

  protected setGearScore(value: number) {
    this.context.patchState({
      gearScore: value,
    })
  }

  public formatValue = (value: any, key: keyof Perks): PropertyGridCell[] => {
    switch (key) {

      case 'PerkID': {
        return [
          {
            value: String(value),
            accent: true,
            routerLink: ['/perks/table', value],
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
        return createTags(value as Perks['ItemClass'])
      }
      case 'ExcludeItemClass': {
        return createTags(value as Perks['ExcludeItemClass'])
      }
      case 'ExclusiveLabels': {
        return createTags(value as Perks['ExclusiveLabels'])
      }
      case 'EquipAbility': {
        return (value as Perks['EquipAbility']).map((it) => {
          return {
            value: it,
            accent: true,
            routerLink: ['/abilities/table', it],
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

  public formatAffixValue = (value: any, key: keyof Affixstats): PropertyGridCell[] => {
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
              template: this.tplCategoryInfo,
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
      routerLink: isLink ? ['/status-effects/table', it] : null,
    }
  })
}
