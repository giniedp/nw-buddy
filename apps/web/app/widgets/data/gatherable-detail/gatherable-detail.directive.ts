import { Directive, forwardRef, Input, Output } from '@angular/core'
import { NwDbService } from '~/nw'
import { GatherableDetailStore } from './gatherable-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbGatherableDetail]',
  exportAs: 'abilityDetail',
  providers: [
    {
      provide: GatherableDetailStore,
      useExisting: forwardRef(() => GatherableDetailDirective),
    },
  ],
})
export class GatherableDetailDirective extends GatherableDetailStore {
  @Input()
  public set nwbGatherableDetail(value: string) {
    this.patchState({ gatherableId: value })
  }

  @Output()
  public nwbGatherableChange = this.gatherable$

  public constructor(db: NwDbService) {
    super(db)
  }
}
