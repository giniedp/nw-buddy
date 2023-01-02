import { Directive, forwardRef, Input, Output } from '@angular/core'
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
  @Input()
  public set nwbStatusEffectDetail(value: string) {
    this.effectId$.next(value)
  }

  @Output()
  public nwbStatusEffectChange = this.effect$

  public constructor(db: NwDbService) {
    super(db)
  }
}
