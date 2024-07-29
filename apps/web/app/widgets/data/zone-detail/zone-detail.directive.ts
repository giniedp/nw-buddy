import { Directive, forwardRef, Input } from '@angular/core'
import { ZoneDetailStore } from './zone-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbZoneDetail]',
  exportAs: 'zoneDetail',
  providers: [
    {
      provide: ZoneDetailStore,
      useExisting: forwardRef(() => ZoneDetailDirective),
    },
  ],
})
export class ZoneDetailDirective extends ZoneDetailStore {
  @Input()
  public set nwbZoneDetail(value: string | number) {
    this.load({ zoneId: value })
  }

  @Input()
  public set markVital(value: string) {
    this.mark({ vitalId: value })
  }
}
