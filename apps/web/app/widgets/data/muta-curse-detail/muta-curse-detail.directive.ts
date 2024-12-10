import { Directive, inject, Input } from '@angular/core'
import { MutaCurseDetailStore } from './muta-curse-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaCurseDetail]',
  exportAs: 'curseDetail',
  providers: [MutaCurseDetailStore],
})
export class MutaCurseDetailDirective {
  public store = inject(MutaCurseDetailStore)

  @Input()
  public set nwbCurseDetail(value: string) {
    this.store.load({ curseId: value, wildcard: null })
  }
}
