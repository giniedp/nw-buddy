import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Ability } from '@nw-data/types'
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

  public formatValue = (value: any, key: keyof Ability): PropertyGridCell[] =>  {
    switch (key) {
      case 'StatusEffect':
      case 'TargetStatusEffect':
      case 'OtherApplyStatusEffect':
      case 'SelfApplyStatusEffect':
      case 'OnEquipStatusEffect': {
        return [{
          value: String(value),
          accent: true,
          routerLink: ['/status-effects/table', value]
        }]
      }
      case 'AbilityID':
      case 'RequiredEquippedAbilityId':
      case 'RequiredAbilityId': {
        return [{
          value: String(value),
          accent: true,
          routerLink: ['/abilities/table', value]
        }]
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
