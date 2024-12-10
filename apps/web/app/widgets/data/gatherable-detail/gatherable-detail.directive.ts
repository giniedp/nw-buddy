import { Directive, inject, Input, Output } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { GatherableDetailStore } from './gatherable-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbGatherableDetail]',
  exportAs: 'gatherableDetail',
  providers: [GatherableDetailStore],
})
export class GatherableDetailDirective {
  public store = inject(GatherableDetailStore)

  @Input()
  public set nwbGatherableDetail(value: string) {
    this.store.load({ gatherableId: value })
  }

  @Output()
  public nwbGatherableChange = toObservable(this.store.gatherable)
}
