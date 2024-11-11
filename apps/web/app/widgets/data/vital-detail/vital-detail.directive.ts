import { computed, Directive, inject, input } from '@angular/core'
import { VitalDetailStore } from './vital-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbVitalDetail]',
  exportAs: 'vitalDetail',
  providers: [VitalDetailStore],
})
export class VitalDetailDirective {
  public store = inject(VitalDetailStore)
  public vitalId = input<string>(null, {
    alias: 'nwbVitalDetail',
  })

  public constructor() {
    this.store.load(
      computed(() => {
        return {
          vitalId: this.vitalId(),
          level: null,
        }
      }),
    )
  }
}
