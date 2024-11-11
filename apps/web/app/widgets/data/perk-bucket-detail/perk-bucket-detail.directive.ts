import { Directive, effect, inject, input, untracked } from '@angular/core'
import { PerkBucketDetailStore } from './perk-bucket-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbPerkBucketDetail]',
  exportAs: 'bucketDetail',
  providers: [PerkBucketDetailStore],
})
export class PerkBucketDetailDirective {
  public store = inject(PerkBucketDetailStore)
  public perkBucketId = input<string>(null, { alias: 'nwbPerkBucketDetail' })

  #fxLoad = effect(() => {
    const perkBucketId = this.perkBucketId()
    untracked(() => this.store.load({ perkBucketId, itemId: null }))
  })
}
