import { ChangeDetectorRef, Directive, forwardRef, Input } from '@angular/core'
import { NwDbService } from '~/nw'
import { ItemDetailService } from './item-detail.service'

@Directive({
  standalone: true,
  selector: '[nwbItemDetail]',
  providers: [
    {
      provide: ItemDetailService,
      useExisting: forwardRef(() => ItemDetailDirective),
    },
  ],
})
export class ItemDetailDirective extends ItemDetailService {
  @Input()
  public set nwbItemDetail(value: string) {
    this.entityId$.next(value)
  }

  @Input()
  public set gearScoreOverride(value: number) {
    this.gearScoreOverride$.next(value)
  }

  public constructor(db: NwDbService, cdRef: ChangeDetectorRef) {
    super(db, cdRef)
  }
}
