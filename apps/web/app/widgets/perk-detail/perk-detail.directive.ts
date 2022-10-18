import { Directive, forwardRef, Input } from '@angular/core'
import { NwDbService } from '~/nw'
import { PerkDetailService } from './perk-detail.service'

@Directive({
  standalone: true,
  selector: '[nwbPerkDetail]',
  exportAs: 'perkDetail',
  providers: [
    {
      provide: PerkDetailService,
      useExisting: forwardRef(() => PerkDetailDirective),
    },
  ],
})
export class PerkDetailDirective extends PerkDetailService {
  @Input('nwbPerkDetail')
  public set perkId(value: string) {
    this.perkId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
