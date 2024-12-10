import { Directive, inject, Input } from '@angular/core'
import { EntitlementDetailStore } from './entitlement-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbEntitlementDetail]',
  exportAs: 'eventDetail',
  providers: [EntitlementDetailStore],
})
export class EntitlementDetailDirective {
  public readonly store = inject(EntitlementDetailStore)

  @Input()
  public set nwbEntitlementDetail(value: string) {
    this.store.load({ entitlementId: value })
  }
}
