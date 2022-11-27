import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TrackByFunction } from '@angular/core'
import { defer } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
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
  protected gearScore$ = defer(() => this.detail.itemGS$)

  @Input()
  public perkEditable: boolean

  @Output()
  public editPerk = new EventEmitter<PerkDetail>()

  protected perks$ = defer(() => this.detail.perksDetails$)

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private detail: ItemDetailService, private db: NwDbService) {
    //
  }

  protected editPerkClicked(item: PerkDetail) {
    if (this.perkEditable && item?.editable) {
      this.editPerk.next(item)
    }
  }
}
