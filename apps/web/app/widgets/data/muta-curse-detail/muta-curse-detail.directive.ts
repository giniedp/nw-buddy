import { Directive, forwardRef, Input } from '@angular/core'
import { MutaCurseDetailStore } from './muta-curse-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMutaCurseDetail]',
  exportAs: 'curseDetail',
  providers: [
    {
      provide: MutaCurseDetailStore,
      useExisting: forwardRef(() => MutaCurseDetailDirective),
    },
  ],
})
export class MutaCurseDetailDirective extends MutaCurseDetailStore {
  @Input()
  public set nwbCurseDetail(value: string) {
    this.patchState({ curseId: value })
  }
}
