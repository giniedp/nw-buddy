import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemDetailStore } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-info',
  templateUrl: './item-detail-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailInfoComponent {

  protected vm$ = this.detail.vmInfo$

  public constructor(private detail: ItemDetailStore) {}
}
