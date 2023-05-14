import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { PerkBucketDetailStore } from './perk-bucket-detail.store'
import { PerkDetailModule } from '../perk-detail'
import { ItemFrameModule } from '~/ui/item-frame'
import { NwModule } from '~/nw'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  selector: 'nwb-perk-bucket-detail',
  templateUrl: './perk-bucket-detail.component.html',
  imports: [CommonModule, NwModule, PerkDetailModule, RouterModule, ItemFrameModule],
  host: {
    class: 'flex flex-col gap-1'
  }
})
export class PerkBucketDetailPerksComponent extends PerkBucketDetailStore {
  @Input()
  public set perkBucketId(value: string) {
    this.patchState({ perkBucketId: value })
  }

  @Input()
  public set itemId(value: string) {
    this.patchState({ itemId: value })
  }
}
