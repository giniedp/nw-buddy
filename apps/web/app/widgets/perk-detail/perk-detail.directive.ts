import { Directive, forwardRef, Input, Output } from '@angular/core'
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
  @Input()
  public set nwbPerkDetail(value: string) {
    this.perkId$.next(value)
  }

  @Output()
  public nwbPerkChange = this.perk$

  public constructor(db: NwDbService) {
    super(db)
  }
}
