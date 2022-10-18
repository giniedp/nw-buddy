import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { StatusEffectDetailService } from './status-effect.service'

@Component({
  standalone: true,
  selector: 'nwb-status-effect-detail',
  templateUrl: './status-effect.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  providers: [
    {
      provide: StatusEffectDetailService,
      useExisting: forwardRef(() => StatusEffectDetailComponent),
    },
  ],
  host: {
    class: 'block bg-base-100 rounded-md overflow-clip',
  },
})
export class StatusEffectDetailComponent extends StatusEffectDetailService {
  @Input()
  public set abilityId(value: string) {
    this.effectId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
