import { Directive, forwardRef, Input } from '@angular/core'
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
  @Input('nwbAbilityDetail')
  public set abilityId(value: string) {
    this.abilityId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
