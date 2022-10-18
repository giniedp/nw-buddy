import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { AbilityDetailService } from './ability-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-ability-detail',
  templateUrl: './ability-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  providers: [
    {
      provide: AbilityDetailService,
      useExisting: forwardRef(() => AbilityDetailComponent),
    },
  ],
  host: {
    class: 'block bg-base-100 rounded-md overflow-clip',
  },
})
export class AbilityDetailComponent extends AbilityDetailService {
  @Input()
  public set abilityId(value: string) {
    this.abilityId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
