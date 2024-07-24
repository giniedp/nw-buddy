import { Directive, forwardRef, Input } from '@angular/core'
import { DamageDetailStore } from './damage-row-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbDamageRowDetail]',
  exportAs: 'damageRowDetail',
  providers: [
    {
      provide: DamageDetailStore,
      useExisting: forwardRef(() => DamageDetailStore),
    },
  ],
})
export class DamageRowDetailDirective extends DamageDetailStore {
  @Input()
  public set nwbDamageRowDetail(value: string) {
    this.load({ rowId: value })
  }
}
