import { CommonModule } from '@angular/common'
import { Component, effect, inject, input, untracked } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PerkDetailModule } from '../perk-detail'
import { PerkBucketDetailStore } from './perk-bucket-detail.store'

@Component({
  selector: 'nwb-perk-bucket-detail',
  templateUrl: './perk-bucket-detail.component.html',
  imports: [CommonModule, NwModule, PerkDetailModule, RouterModule, ItemFrameModule],
  providers: [PerkBucketDetailStore],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class PerkBucketDetailPerksComponent {
  public store = inject(PerkBucketDetailStore)
  public perkBucketId = input<string>(null)
  public itemId = input<string>(null)

  #fxLoad = effect(() => {
    const perkBucketId = this.perkBucketId()
    const itemId = this.itemId()
    untracked(() => this.store.load({ perkBucketId, itemId }))
  })
}
