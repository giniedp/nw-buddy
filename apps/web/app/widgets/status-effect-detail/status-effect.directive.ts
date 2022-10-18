import { Directive, forwardRef, Input } from '@angular/core'
import { NwDbService } from '~/nw'
import { StatusEffectDetailService } from './status-effect.service'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectDetail]',
  exportAs: 'effectDetail',
  providers: [
    {
      provide: StatusEffectDetailService,
      useExisting: forwardRef(() => StatusEffectDetailDirective),
    },
  ],
})
export class StatusEffectDetailDirective extends StatusEffectDetailService {
  @Input('nwbStatusEffectDetail')
  public set abilityId(value: string) {
    this.effectId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
