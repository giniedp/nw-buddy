import { Directive, forwardRef, Input } from '@angular/core'
import { NwDataService } from '~/data'
import { SpellDetailStore } from './spell-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbSpellDetail]',
  exportAs: 'abilityDetail',
  providers: [
    {
      provide: SpellDetailStore,
      useExisting: forwardRef(() => SpellDetailDirective),
    },
  ],
})
export class SpellDetailDirective extends SpellDetailStore {
  @Input()
  public set nwbSpellDetail(value: string) {
    this.patchState({ spellId: value })
  }

  public constructor(db: NwDataService) {
    super(db)
  }
}
