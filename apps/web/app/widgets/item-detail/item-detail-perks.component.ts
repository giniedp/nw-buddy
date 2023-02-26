import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore, PerkDetail } from './item-detail.service'

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

  public constructor(private detail: ItemDetailStore) {
    //
  }

  protected async editPerkClicked({ detail, editable }: { detail: PerkDetail; editable: boolean }) {
    const isEditable = await firstValueFrom(this.detail.perkEditable$)
    if (isEditable && editable) {
      this.detail.perkEdit$.emit(detail)
    }
  }
}
