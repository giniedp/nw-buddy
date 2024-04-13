import { Directive, inject, Input, Output } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { AbilityDetailStore } from './ability-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbAbilityDetail]',
  exportAs: 'abilityDetail',
  providers: [AbilityDetailStore],
})
export class AbilityDetailDirective {
  public readonly store = inject(AbilityDetailStore)
  @Input()
  public set nwbAbilityDetail(value: string) {
    this.store.load(value)
  }

  @Output()
  public nwbAbilityChange = toObservable(this.store.ability)
}
