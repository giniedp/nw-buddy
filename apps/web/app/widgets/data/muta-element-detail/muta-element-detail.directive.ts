import { Directive, forwardRef, inject, Input } from '@angular/core'
import { MutaElementDetailStore } from './muta-element-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaElementDetail]',
  exportAs: 'elementDetail',
  providers: [MutaElementDetailStore],
})
export class MutaElementDetailDirective {
  public store = inject(MutaElementDetailStore)
  @Input()
  public set nwbMutaElementDetail(value: string) {
    this.store.load({ elementId: value })
  }
}
