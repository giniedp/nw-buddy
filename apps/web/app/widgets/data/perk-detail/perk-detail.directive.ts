import { Directive, effect, inject, input, untracked } from '@angular/core'
import { PerkDetailStore } from './perk-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbPerkDetail]',
  exportAs: 'perkDetail',
  providers: [PerkDetailStore],
})
export class PerkDetailDirective {
  public store = inject(PerkDetailStore)
  public perkId = input<string>(null, {
    alias: 'nwbPerkDetail',
  })
  #fxLoad = effect(() => {
    const perkId = this.perkId()
    untracked(() => this.store.load(perkId))
  })
}
