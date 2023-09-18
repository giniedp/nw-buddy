import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Perks } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { GsInputComponent } from '~/ui/gs-input'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  templateUrl: './perk-detail.component.html',
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule, GsInputComponent, FormsModule, TooltipModule],
  providers: [
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
  public constructor(db: NwDbService) {
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
      default: {
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
