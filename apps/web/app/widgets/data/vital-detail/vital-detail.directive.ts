import { Directive, forwardRef, Input } from '@angular/core'
import { VitalDetailStore } from './vital-detail.store'
import { patchState } from '@ngrx/signals'

@Directive({
  standalone: true,
  selector: '[nwbVitalDetail]',
  exportAs: 'vitalDetail',
  providers: [
    {
      provide: VitalDetailStore,
      useExisting: forwardRef(() => VitalDetailDirective),
    },
  ],
})
export class VitalDetailDirective extends VitalDetailStore {
  @Input()
  public set nwbVitalDetail(value: string) {
    patchState(this, { vitalId: value })
  }
}
