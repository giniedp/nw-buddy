import { Directive, forwardRef, inject, Input } from '@angular/core'
import { DamageDetailStore } from './damage-row-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbDamageRowDetail]',
  exportAs: 'damageRowDetail',
  providers: [DamageDetailStore],
})
export class DamageRowDetailDirective {
  public store = inject(DamageDetailStore)

  @Input()
  public set nwbDamageRowDetail(value: { table: string; rowId: string }) {
    this.store.load(value)
  }
}
