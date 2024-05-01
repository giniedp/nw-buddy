import { Directive, inject, Input, Output } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { patchState } from '@ngrx/signals'
import { GatherableDetailStore2 } from './gatherable-detail.store2'

@Directive({
  standalone: true,
  selector: '[nwbGatherableDetail]',
  exportAs: 'gatherableDetail',
  providers: [GatherableDetailStore2],
})
export class GatherableDetailDirective {
  public store = inject(GatherableDetailStore2)

  @Input()
  public set nwbGatherableDetail(value: string) {
    patchState(this.store, { gatherableId: value })
  }

  @Output()
  public nwbGatherableChange = toObservable(this.store.gatherable)
}
