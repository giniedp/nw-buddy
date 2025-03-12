import { Directive, inject, Input } from '@angular/core'
import { MountDetailStore } from './mount-detail.store'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'

@Directive({
  standalone: true,
  selector: '[nwbMountDetail]',
  exportAs: 'mountDetail',
  providers: [MountDetailStore],
})
export class MountDetailDirective {
  public store = inject(MountDetailStore)
  @Input()
  public set nwbMountDetail(value: string) {
    this.store.load(value)
  }

  public nwbMountChange = outputFromObservable(toObservable(this.store.mount))
}
