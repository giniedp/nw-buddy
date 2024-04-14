import { Directive, inject, Input } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { ZoneDetailStore } from './zone-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbZoneDetail]',
  exportAs: 'zoneDetail',
  providers: [ZoneDetailStore],
})
export class ZoneDetailDirective {
  public readonly store = inject(ZoneDetailStore)

  @Input()
  public set nwbZoneDetail(value: string | number) {
    this.store.load(value)
  }

  @Input()
  public set markVital(value: string) {
    patchState(this.store, { markedVitalId: value })
  }
}
