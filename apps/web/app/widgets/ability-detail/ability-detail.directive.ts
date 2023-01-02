import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDbService } from '~/nw'
import { AbilityDetailService } from './ability-detail.service'

@Directive({
  standalone: true,
  selector: '[nwbAbilityDetail]',
  exportAs: 'abilityDetail',
  providers: [
    {
      provide: AbilityDetailService,
      useExisting: forwardRef(() => AbilityDetailDirective),
    },
  ],
})
export class AbilityDetailDirective extends AbilityDetailService {
  @Input()
  public set nwbAbilityDetail(value: string) {
    this.abilityId$.next(value)
  }

  @Output()
  public nwbAbilityChange = this.ability$

  public constructor(db: NwDbService) {
    super(db)
  }
}
