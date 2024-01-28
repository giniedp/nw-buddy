import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDataService } from '~/data'
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

  public constructor(db: NwDataService) {
    super(db)
  }
}
