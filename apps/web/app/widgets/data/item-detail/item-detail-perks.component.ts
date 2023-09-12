import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailStore, PerkDetail } from './item-detail.store'

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
  protected items$ = this.store.vmPerks$

  protected trackByIndex = (i: number) => i

  public constructor(private store: ItemDetailStore) {
    //
  }

  protected async editPerkClicked({ detail, editable }: { detail: PerkDetail; editable: boolean }) {
    const isEditable = await firstValueFrom(this.store.perkEditable$)
    if (isEditable && editable) {
      this.store.perkEdit$.emit(detail)
    }
  }

  protected buildTextContext(perkId: string, gs: number, context: Record<string, any>) {
    return { itemId: perkId, gearScore: gs, ...(context || {}) }
  }
}
