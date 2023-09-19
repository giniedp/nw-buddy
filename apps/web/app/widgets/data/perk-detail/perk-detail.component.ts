import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Perks } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { GsInputComponent } from '~/ui/gs-input'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { PerkDetailStore } from './perk-detail.store'
import { parseScalingPerGearScore } from '@nw-data/common'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  templateUrl: './perk-detail.component.html',
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, GsInputComponent, FormsModule, TooltipModule],
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

  protected trackByIndex = (i: number) => i
  public constructor(db: NwDbService, protected decimals: DecimalPipe) {
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
}

function createTags(value: string[]): PropertyGridCell[] {
  return value.map((it) => {
    return {
      value: it,
      secondary: true,
    }
  })
}
