import { Directive, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { StatusEffectDetailStore } from './status-effect.store'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectDetail]',
  exportAs: 'effectDetail',
  providers: [StatusEffectDetailStore],
})
export class StatusEffectDetailDirective {
  public store = inject(StatusEffectDetailStore)
  public effectId = input<string>(null, {
    alias: 'nwbStatusEffectDetail',
  })
  public nwbStatusEffectDetailChange = outputFromObservable(toObservable(this.store.effect))

  #fxLoad = effect(() => {
    const effectId = this.effectId()
    untracked(() => this.store.load(effectId))
  })
}
