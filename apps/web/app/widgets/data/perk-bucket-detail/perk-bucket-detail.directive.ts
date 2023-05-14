import { Directive, forwardRef, Input } from '@angular/core'
import { NwDbService } from '~/nw'
import { PerkBucketDetailStore } from './perk-bucket-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbPerkBucketDetail]',
  exportAs: 'bucketDetail',
  providers: [
    {
      provide: PerkBucketDetailStore,
      useExisting: forwardRef(() => PerkBucketDetailDirective),
    },
  ],
})
export class PerkBucketDetailDirective extends PerkBucketDetailStore {
  @Input()
  public set nwbPerkBucketDetail(value: string) {
    this.patchState({ perkBucketId: value })
  }

  public constructor(db: NwDbService) {
    super(db)
  }
}
