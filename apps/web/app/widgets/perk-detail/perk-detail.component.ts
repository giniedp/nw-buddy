import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { NwDbService, NwModule } from '~/nw'
import { PerkDetailService } from './perk-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-perk-detail',
  templateUrl: './perk-detail.component.html',
  exportAs: 'perkDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  providers: [
    {
      provide: PerkDetailService,
      useExisting: forwardRef(() => PerkDetailComponent),
    },
  ],
  host: {
    class: 'block bg-base-100 rounded-md overflow-clip',
  },
})
export class PerkDetailComponent extends PerkDetailService {
  @Input()
  public set perkId(value: string) {
    this.perkId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
