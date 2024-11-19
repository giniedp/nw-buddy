import { Directive, effect, inject, input, untracked } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { AppearanceDetailStore } from './appearance-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbAppearanceDetail]',
  exportAs: 'appearanceDetail',
  providers: [AppearanceDetailStore],
})
export class AppearanceDetailDirective {
  public store = inject(AppearanceDetailStore)
  public appearanceId = input<string>(null, {
    alias: 'nwbAppearanceDetail',
  })
  public nwbAppearanceChange = outputFromObservable(toObservable(this.store.appearance))

  #fxLoad = effect(() => {
    const appearanceId = this.appearanceId()
    untracked(() => {
      this.store.load({ appearanceIdOrName: appearanceId })
    })
  })
}
