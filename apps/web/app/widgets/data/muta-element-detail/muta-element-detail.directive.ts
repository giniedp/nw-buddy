import { Directive, forwardRef, Input } from '@angular/core'
import { MutaElementDetailStore } from './muta-element-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaElementDetail]',
  exportAs: 'elementDetail',
  providers: [
    {
      provide: MutaElementDetailStore,
      useExisting: forwardRef(() => MutaElementDetailDirective),
    },
  ],
})
export class MutaElementDetailDirective extends MutaElementDetailStore {
  @Input()
  public set nwbMutaElementDetail(value: string) {
    this.patchState({ elementId: value })
  }
}
