import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDataService } from '~/data'
import { AbilityDetailStore } from './ability-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbAbilityDetail]',
  exportAs: 'abilityDetail',
  providers: [
    {
      provide: AbilityDetailStore,
      useExisting: forwardRef(() => AbilityDetailDirective),
    },
  ],
})
export class AbilityDetailDirective extends AbilityDetailStore {
  @Input()
  public set nwbAbilityDetail(value: string) {
    this.patchState({ abilityId: value })
  }

  @Output()
  public nwbAbilityChange = this.ability$
}
