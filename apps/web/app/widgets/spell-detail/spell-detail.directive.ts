import { Directive, forwardRef, Input } from '@angular/core'
import { NwDbService } from '~/nw'
import { SpellDetailService } from './spell-detail.service'

@Directive({
  standalone: true,
  selector: '[nwbSpellDetail]',
  exportAs: 'abilityDetail',
  providers: [
    {
      provide: SpellDetailService,
      useExisting: forwardRef(() => SpellDetailDirective),
    },
  ],
})
export class SpellDetailDirective extends SpellDetailService {
  @Input()
  public set nwbSpellDetail(value: string) {
    this.spellId$.next(value)
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
