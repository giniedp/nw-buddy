import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDbService } from '~/nw'
import { MountDetailStore } from './mount-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbMountDetail]',
  exportAs: 'mountDetail',
  providers: [
    {
      provide: MountDetailStore,
      useExisting: forwardRef(() => MountDetailDirective),
    },
  ],
})
export class MountDetailDirective extends MountDetailStore {
  @Input()
  public set nwbPerkDetail(value: string) {
    this.patchState({ mountId: value })
  }

  @Output()
  public nwbMountChange = this.mount$

  public constructor(db: NwDbService) {
    super(db)
  }
}
