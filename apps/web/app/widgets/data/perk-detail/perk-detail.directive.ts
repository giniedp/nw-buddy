import { Directive, forwardRef, Input } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { PerkDetailStore } from './perk-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbPerkDetail]',
  exportAs: 'perkDetail',
  providers: [
    {
      provide: PerkDetailStore,
      useExisting: forwardRef(() => PerkDetailDirective),
    },
  ],
})
export class PerkDetailDirective extends PerkDetailStore {
  @Input()
  public set nwbPerkDetail(value: string) {
    this.load({ perkId: value })
  }

  public nwbPerkChange = outputFromObservable(toObservable(this.perk))
}
