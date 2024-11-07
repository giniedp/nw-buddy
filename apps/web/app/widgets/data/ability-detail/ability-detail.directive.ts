import { Directive, inject, Input } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { AbilityDetailStore } from './ability-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbAbilityDetail]',
  exportAs: 'abilityDetail',
  providers: [AbilityDetailStore],
})
export class AbilityDetailDirective {
  public store = inject(AbilityDetailStore)
  @Input()
  public set nwbAbilityDetail(value: string) {
    this.store.load({ abilityId: value })
  }

  public nwbAbilityChange = outputFromObservable(toObservable(this.store.ability))
}
