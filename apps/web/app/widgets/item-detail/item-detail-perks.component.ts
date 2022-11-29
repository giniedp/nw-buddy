import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailService, PerkDetail } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class ItemDetailPerksComponent {
  protected items$ = this.detail.vmPerks$

  protected trackByIndex = (i: number) => i

  public constructor(private detail: ItemDetailService) {
    //
  }

  protected editPerkClicked(item: PerkDetail) {
    if (this.detail.perkEditable$.value) {
      this.detail.perkEdit$.emit(item)
    }
  }
}
