import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Statuseffect } from '@nw-data/types'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridCell, PropertyGridModule } from '~/ui/property-grid'
import { StatusEffectDetailService } from './status-effect.service'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-detail',
  templateUrl: './status-effect.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [
    {
      provide: StatusEffectDetailService,
      useExisting: forwardRef(() => StatusEffectDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class StatusEffectDetailComponent extends StatusEffectDetailService {
  @Input()
  public set effectId(value: string) {
    this.effectId$.next(value)
  }

  @Input()
  public showProperties: boolean

  public constructor(db: NwDbService) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Statuseffect): PropertyGridCell[] =>  {
    switch (key) {
      case 'StatusID':
      case 'OnDeathStatusEffect':
      case 'OnEndStatusEffect':
      case 'OnStackStatusEffect':
      case 'OnTickStatusEffect': {
        return [{
          value: String(value),
          accent: true,
          routerLink: ['/status-effects/table', value]
        }]
      }
      case 'EquipAbility': {
        return [{
          value: String(value),
          accent: true,
          routerLink: ['/abilities/table', value]
        }]
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
