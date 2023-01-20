import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Perks } from '@nw-data/types'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { PerkDetailService } from './perk-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  templateUrl: './perk-detail.component.html',
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [
    {
      provide: PerkDetailService,
      useExisting: forwardRef(() => PerkDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class PerkDetailComponent extends PerkDetailService {
  @Input()
  public set perkId(value: string) {
    this.perkId$.next(value)
  }

  @Input()
  public showProperties: boolean

  public constructor(db: NwDbService) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Perks): PropertyGridCell[] =>  {
    switch (key) {
      case 'PerkID': {
        return [{
          value: String(value),
          accent: true,
          routerLink: ['/perks/table', value]
        }]
      }
      case 'Affix': {
        return [{
          value: String(value),
          primary: true,
          italic: true
        }]
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
            routerLink: ['/abilities/table', it]
          }
        })
      }
      default: {
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

function createTags(value: string[]): PropertyGridCell[] {
  return value.map((it) => {
    return {
      value: it,
      secondary: true
    }
  })
}

