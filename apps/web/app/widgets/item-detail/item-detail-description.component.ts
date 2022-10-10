import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemDetailService } from './item-detail.service'

@Component({
  standalone: true,
  selector: 'nwb-item-detail-description',
  template: ` {{ detail.description$ | async | nwText }} `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block p-3 text-primary italic'
  },
})
export class ItemDetailDescriptionComponent {
  public constructor(protected detail: ItemDetailService) {
    //
  }
}
