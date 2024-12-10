import { Directive, effect, inject, input, untracked } from '@angular/core'
import { SpellDetailStore } from './spell-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbSpellDetail]',
  exportAs: 'abilityDetail',
  providers: [SpellDetailStore],
})
export class SpellDetailDirective {
  public store = inject(SpellDetailStore)
  public spellId = input<string>(null, {
    alias: 'nwbSpellDetail',
  })
  #fxLoad = effect(() => {
    const spellId = this.spellId()
    untracked(() => this.store.load(spellId))
  })
}
